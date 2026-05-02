import fs from "node:fs";
import path from "node:path";
import { loadEnv, normalizeUrl, requireEnv } from "./_utils.mjs";

const env = loadEnv();
const reportPath = path.join(process.cwd(), "scripts", "medusa", "parity-report.json");

const shopDomain = (env.SHOPIFY_ADMIN_DOMAIN || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");
const shopifyToken = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const medusaBackendUrl = env.MEDUSA_BACKEND_URL || env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const medusaUrl = normalizeUrl(medusaBackendUrl);
const medusaToken = env.MEDUSA_ADMIN_API_TOKEN;

requireEnv(
  {
    ...env,
    MEDUSA_BACKEND_URL: medusaBackendUrl,
  },
  [
    "SHOPIFY_ADMIN_DOMAIN",
    "SHOPIFY_ADMIN_ACCESS_TOKEN",
    "MEDUSA_BACKEND_URL",
    "MEDUSA_ADMIN_API_TOKEN",
  ]
);

async function shopifyGraphQL(query, variables = {}) {
  const res = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
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

async function medusaAdmin(pathname) {
  const res = await fetch(`${medusaUrl}${pathname}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${medusaToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Medusa admin failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  return res.json();
}

async function getShopifyCountsAndSnapshot() {
  const query = `
    query Snapshot {
      products(first: 250) {
        nodes {
          id
          handle
          title
          images(first: 20) { nodes { url } }
          variants(first: 100) {
            nodes {
              id
              price
              inventoryQuantity
            }
          }
        }
      }
      collections(first: 250) {
        nodes {
          id
          handle
          title
        }
      }
    }
  `;

  const data = await shopifyGraphQL(query);
  return {
    products: data.products.nodes || [],
    collections: data.collections.nodes || [],
  };
}

async function getMedusaCountsAndSnapshot() {
  const productResp = await medusaAdmin("/admin/products?limit=250");
  const categoryResp = await medusaAdmin("/admin/product-categories?limit=250");

  return {
    products: productResp.products || [],
    collections: categoryResp.product_categories || [],
    productsCount: productResp.count || (productResp.products || []).length,
    categoriesCount: categoryResp.count || (categoryResp.product_categories || []).length,
  };
}

function compareParity(shopify, medusa) {
  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      shopifyProducts: shopify.products.length,
      medusaProducts: medusa.productsCount,
      shopifyCollections: shopify.collections.length,
      medusaCollections: medusa.categoriesCount,
      productCountParity: shopify.products.length === medusa.productsCount,
      categoryCountParity: shopify.collections.length === medusa.categoriesCount,
    },
    variantChecks: [],
    imageChecks: [],
    missingProductsByHandle: [],
  };

  const medusaByHandle = new Map(
    medusa.products
      .filter((p) => Boolean(p.handle))
      .map((p) => [p.handle, p])
  );

  for (const sp of shopify.products) {
    const mp = medusaByHandle.get(sp.handle);
    if (!mp) {
      report.missingProductsByHandle.push(sp.handle);
      continue;
    }

    const shopifyVariantCount = (sp.variants?.nodes || []).length;
    const medusaVariantCount = (mp.variants || []).length;

    report.variantChecks.push({
      handle: sp.handle,
      shopifyVariantCount,
      medusaVariantCount,
      variantCountMatch: shopifyVariantCount === medusaVariantCount,
      shopifyFirstPrice: sp.variants?.nodes?.[0]?.price || null,
      medusaFirstPriceCents:
        mp.variants?.[0]?.prices?.[0]?.amount ??
        mp.variants?.[0]?.calculated_price?.calculated_amount ??
        null,
      shopifyFirstInventory: sp.variants?.nodes?.[0]?.inventoryQuantity ?? null,
      medusaFirstInventory: mp.variants?.[0]?.inventory_quantity ?? null,
    });

    report.imageChecks.push({
      handle: sp.handle,
      shopifyImageCount: (sp.images?.nodes || []).length,
      medusaImageCount: (mp.images || []).length,
      imageCountMatch: (sp.images?.nodes || []).length === (mp.images || []).length,
    });
  }

  return report;
}

async function run() {
  console.log("=== Phase 3 Parity Validation (Dry Migration) ===");

  const shopify = await getShopifyCountsAndSnapshot();
  const medusa = await getMedusaCountsAndSnapshot();
  const report = compareParity(shopify, medusa);

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Report generated: ${reportPath}`);
  console.log(`Product parity: ${report.counts.productCountParity}`);
  console.log(`Category parity: ${report.counts.categoryCountParity}`);
  console.log(`Missing products in Medusa: ${report.missingProductsByHandle.length}`);
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
