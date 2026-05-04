import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  chunk,
  loadEnv,
  normalizeUrl,
  requireEnv,
  sleep,
  toCents,
  tryMedusaAdminLogin,
} from "./_utils.mjs";

const env = loadEnv();
const dryRun = String(env.DRY_RUN || "true").toLowerCase() === "true";
const deltaSince = (env.DELTA_SINCE || "").trim();

const shopifyApiVersion = String(env.SHOPIFY_API_VERSION || "2024-01").trim() || "2024-01";
const shopDomain = (env.SHOPIFY_ADMIN_DOMAIN || env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//i, "")
  .replace(/\/$/, "");
const shopifyToken = env.SHOPIFY_ADMIN_ACCESS_TOKEN || env.SHOPIFY_STORE_PASSWORD;
const medusaBackendUrl = env.MEDUSA_BACKEND_URL || env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const medusaUrl = normalizeUrl(medusaBackendUrl);
let medusaToken = env.MEDUSA_ADMIN_API_TOKEN || "";
const medusaAdminEmail = env.MEDUSA_ADMIN_EMAIL || "";
const medusaAdminPassword = env.MEDUSA_ADMIN_PASSWORD || "";
const regionId = env.MEDUSA_REGION_ID || env.NEXT_PUBLIC_MEDUSA_REGION_ID || "";

requireEnv(
  {
    ...env,
    SHOPIFY_ADMIN_DOMAIN: shopDomain,
    SHOPIFY_ADMIN_ACCESS_TOKEN: shopifyToken,
    MEDUSA_BACKEND_URL: medusaBackendUrl,
  },
  [
    "SHOPIFY_ADMIN_DOMAIN",
    "SHOPIFY_ADMIN_ACCESS_TOKEN",
    "MEDUSA_BACKEND_URL",
  ]
);

const stateFile = path.join(process.cwd(), "scripts", "medusa", "import-state.json");

function toMedusaHandle(input, seed) {
  const raw = String(input || "").trim();
  const normalized = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug;

  const h = crypto
    .createHash("sha1")
    .update(String(seed || raw || Date.now()))
    .digest("hex")
    .slice(0, 10);
  return `import-${h}`;
}

function loadState() {
  if (!fs.existsSync(stateFile)) {
    return {
      importedCollections: {},
      importedProducts: {},
    };
  }

  return JSON.parse(fs.readFileSync(stateFile, "utf8"));
}

function saveState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

async function shopifyGraphQL(query, variables = {}) {
  const res = await fetch(`https://${shopDomain}/admin/api/${shopifyApiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Shopify-Access-Token": shopifyToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify GraphQL failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

async function medusaAdmin(pathname, init = {}, retried = false) {
  const res = await fetch(`${medusaUrl}${pathname}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(medusaToken ? { authorization: `Bearer ${medusaToken}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 && !retried) {
    const token = await tryMedusaAdminLogin({
      backendUrl: medusaUrl,
      email: medusaAdminEmail,
      password: medusaAdminPassword,
    });
    if (token) {
      medusaToken = token;
      return medusaAdmin(pathname, init, true);
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Medusa admin failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function fetchAllCollections() {
  const query = `
    query Collections($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          handle
          title
          image { url altText }
          products(first: 1) {
            nodes {
              featuredImage { url altText }
            }
          }
        }
      }
    }
  `;

  const out = [];
  let after = null;

  while (true) {
    const data = await shopifyGraphQL(query, { first: 250, after });
    out.push(...(data.collections.nodes || []));

    const pageInfo = data.collections.pageInfo;
    if (!pageInfo?.hasNextPage) break;
    after = pageInfo.endCursor;
    await sleep(100);
  }

  return out;
}

async function fetchAllProducts() {
  const query = `
    query Products($first: Int!, $after: String, $query: String) {
      products(first: $first, after: $after, query: $query) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          handle
          title
          status
          description
          productType
          tags
          featuredImage { url altText }
          images(first: 100) { nodes { url altText } }
          collections(first: 20) { nodes { id handle title } }
          variants(first: 100) {
            nodes {
              id
              title
              sku
              price
              compareAtPrice
              inventoryQuantity
              selectedOptions { name value }
              presentmentPrices(first: 20) {
                nodes {
                  price { amount currencyCode }
                  compareAtPrice { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  `;

  const out = [];
  let after = null;
  const filter = deltaSince ? `updated_at:>=${deltaSince}` : null;

  while (true) {
    const data = await shopifyGraphQL(query, { first: 100, after, query: filter });
    out.push(...(data.products.nodes || []));

    const pageInfo = data.products.pageInfo;
    if (!pageInfo?.hasNextPage) break;
    after = pageInfo.endCursor;
    await sleep(150);
  }

  return out;
}

async function findCollectionByHandle(handle) {
  const safeHandle = toMedusaHandle(handle, handle);
  try {
    const list = await medusaAdmin(`/admin/collections?limit=100&handle=${encodeURIComponent(safeHandle)}`);
    return (list.collections || [])[0] || null;
  } catch {
    const list = await medusaAdmin(`/admin/collections?limit=100`);
    return (list.collections || []).find((c) => c?.handle === safeHandle) || null;
  }
}

async function createOrGetCollection(collection, state) {
  if (state.importedCollections[collection.id]) {
    return state.importedCollections[collection.id];
  }

  const medusaHandle = toMedusaHandle(collection.handle, collection.id);
  const existing = await findCollectionByHandle(medusaHandle);
  if (existing?.id) {
    state.importedCollections[collection.id] = existing.id;
    return existing.id;
  }

  if (dryRun) {
    const fakeId = `dry-cat-${medusaHandle}`;
    state.importedCollections[collection.id] = fakeId;
    return fakeId;
  }

  const payload = {
    title: collection.title,
    handle: medusaHandle,
    metadata: {
      shopify_id: collection.id,
      shopify_handle: collection.handle,
      image_url: collection.image?.url || collection.products?.nodes?.[0]?.featuredImage?.url || null,
    },
  };

  const created = await medusaAdmin("/admin/collections", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const id = created.collection?.id;
  state.importedCollections[collection.id] = id;
  return id;
}

function buildProductOptions(product) {
  const optionValuesByName = new Map();

  for (const variant of product.variants.nodes || []) {
    for (const so of variant.selectedOptions || []) {
      const name = so?.name;
      const value = so?.value;
      if (!name || !value) continue;

      if (!optionValuesByName.has(name)) {
        optionValuesByName.set(name, new Set());
      }
      optionValuesByName.get(name).add(value);
    }
  }

  return Array.from(optionValuesByName.entries()).map(([name, values]) => ({
    title: name,
    values: Array.from(values),
  }));
}

function buildProductVariants(product) {
  return (product.variants.nodes || []).map((v) => {
    // Attempt to find PKR price in presentmentPrices (Shopify Market specific)
    const pkrPriceNode = (v.presentmentPrices?.nodes || []).find(
      (p) => p.price?.currencyCode === "PKR"
    );

   const priceAmount = parseFloat(
  pkrPriceNode ? pkrPriceNode.price.amount : v.price
);
const compareAmount = parseFloat(
  pkrPriceNode ? pkrPriceNode.compareAtPrice?.amount : v.compareAtPrice
);


    return {
      title: v.title || "Default",
      sku: v.sku || undefined,
      manage_inventory: true,
      allow_backorder: false,
      options: (v.selectedOptions || []).reduce((acc, so) => {
        if (so?.name) acc[so.name] = so.value || "";
        return acc;
      }, {}),
      prices: [
        {
          amount: toCents(priceAmount, "pkr"),
          currency_code: "pkr",
        },
      ],
      metadata: {
        shopify_variant_id: v.id,
        compare_at_price: compareAmount ? toCents(compareAmount, "pkr") : null,
        shopify_inventory_quantity: typeof v.inventoryQuantity === "number" ? v.inventoryQuantity : null,
        original_currency: pkrPriceNode ? "PKR" : "Shopify-Base",
      },
    };
  });
}

async function findProductByHandle(handle) {
  const safeHandle = toMedusaHandle(handle, handle);
  const list = await medusaAdmin(`/admin/products?limit=1&handle=${encodeURIComponent(safeHandle)}`);
  return (list.products || [])[0] || null;
}

async function createOrUpdateProduct(product, collectionId, state) {
  if (state.importedProducts[product.id]) return state.importedProducts[product.id];

  const medusaHandle = toMedusaHandle(product.handle, product.id);
  const existing = await findProductByHandle(medusaHandle);
  const payload = {
    title: product.title,
    subtitle: product.productType || undefined,
    handle: medusaHandle,
    status: product.status === "ACTIVE" ? "published" : "draft",
    description: product.description || "",
    collection_id: collectionId && !String(collectionId).startsWith("dry-cat-") ? collectionId : undefined,
    thumbnail: product.featuredImage?.url || product.images?.nodes?.[0]?.url || undefined,
    images: (product.images.nodes || []).map((img) => ({
      url: img.url,
    })),
    options: buildProductOptions(product),
    variants: buildProductVariants(product),
    metadata: {
      shopify_product_id: product.id,
      shopify_handle: product.handle,
      shopify_tags: product.tags || [],
      source: "shopify-import",
    },
  };

  if (regionId) {
    // Medusa v2 admin product create doesn’t accept region_id; pricing is handled by region at read time.
  }

  if (dryRun) {
    const dryId = existing?.id || `dry-prod-${product.handle}`;
    state.importedProducts[product.id] = dryId;
    return dryId;
  }

  let id;
  if (existing?.id) {
    const updated = await medusaAdmin(`/admin/products/${existing.id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    id = updated.product?.id;
  } else {
    const created = await medusaAdmin("/admin/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    id = created.product?.id;
  }

  state.importedProducts[product.id] = id;
  return id;
}

async function run() {
  console.log("=== Phase 3: Shopify -> Medusa Import ===");
  console.log(`Shopify admin domain: ${shopDomain}`);
  console.log(`Medusa backend: ${medusaUrl}`);
  console.log(`Dry run: ${dryRun}`);
  if (deltaSince) {
    console.log(`Delta mode: updated_at >= ${deltaSince}`);
  }

  const state = loadState();

  const collections = await fetchAllCollections();
  console.log(`Fetched collections from Shopify: ${collections.length}`);

  let importedCollectionCount = 0;
  for (const collection of collections) {
    const collectionId = await createOrGetCollection(collection, state);
    if (collectionId) importedCollectionCount += 1;
  }
  saveState(state);
  console.log(`Collections processed: ${importedCollectionCount}`);

  const products = await fetchAllProducts();
  console.log(`Fetched products from Shopify: ${products.length}`);

  let importedProducts = 0;
  for (const batch of chunk(products, 10)) {
    for (const product of batch) {
      const firstCollection = product.collections?.nodes?.[0];
      const collectionId = firstCollection ? state.importedCollections[firstCollection.id] : null;
      await createOrUpdateProduct(product, collectionId, state);
      importedProducts += 1;
    }
    saveState(state);
    console.log(`Products processed: ${importedProducts}/${products.length}`);
    await sleep(200);
  }

  console.log("Phase 3 import complete.");
  console.log(`State file: ${stateFile}`);
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
