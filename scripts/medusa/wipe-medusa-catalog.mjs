import fs from "node:fs";
import path from "node:path";
import { loadEnv, normalizeUrl, requireEnv, sleep, tryMedusaAdminLogin } from "./_utils.mjs";

const env = loadEnv();
const dryRun = String(env.DRY_RUN || "false").toLowerCase() === "true";

const medusaBackendUrl = env.MEDUSA_BACKEND_URL || env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const medusaUrl = normalizeUrl(medusaBackendUrl);
let adminToken = env.MEDUSA_ADMIN_API_TOKEN || "";
const adminEmail = env.MEDUSA_ADMIN_EMAIL || "";
const adminPassword = env.MEDUSA_ADMIN_PASSWORD || "";

requireEnv(
  {
    ...env,
    MEDUSA_BACKEND_URL: medusaBackendUrl,
  },
  ["MEDUSA_BACKEND_URL"]
);

const confirm = String(env.CONFIRM || "").trim();
if (!dryRun && confirm !== "DELETE_MEDUSA_CATALOG") {
  console.error(
    "Refusing to wipe catalog without CONFIRM=DELETE_MEDUSA_CATALOG (set DRY_RUN=true to preview)."
  );
  process.exit(1);
}

async function adminRequest(pathname, init = {}, retried = false) {
  const res = await fetch(`${medusaUrl}${pathname}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(adminToken ? { authorization: `Bearer ${adminToken}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 && !retried) {
    const token = await tryMedusaAdminLogin({
      backendUrl: medusaUrl,
      email: adminEmail,
      password: adminPassword,
    });

    if (token) {
      adminToken = token;
      return adminRequest(pathname, init, true);
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Medusa admin request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

async function pagedList(endpoint, key) {
  const limit = 100;
  let offset = 0;
  const ids = [];

  // Many Medusa endpoints return { [key]: [], count, offset, limit }
  // If that shape changes, this will simply stop when it sees an empty array.
  while (true) {
    const data = await adminRequest(`${endpoint}?limit=${limit}&offset=${offset}`);
    const items = Array.isArray(data?.[key]) ? data[key] : [];

    for (const item of items) {
      if (item?.id) ids.push(item.id);
    }

    if (!items.length) break;

    offset += items.length;
    if (items.length < limit) break;

    await sleep(100);
  }

  return ids;
}

async function deleteMany(label, ids, deletePathForId) {
  console.log(`${label}: ${ids.length}`);

  let deleted = 0;
  for (const id of ids) {
    if (dryRun) {
      deleted += 1;
      continue;
    }

    await adminRequest(deletePathForId(id), { method: "DELETE" });
    deleted += 1;

    if (deleted % 25 === 0) {
      console.log(`${label} deleted: ${deleted}/${ids.length}`);
    }

    await sleep(30);
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would delete ${ids.length} ${label.toLowerCase()}.`);
  } else {
    console.log(`${label} deleted: ${deleted}/${ids.length}`);
  }
}

async function removeImporterState() {
  const stateFile = path.join(process.cwd(), "scripts", "medusa", "import-state.json");
  if (!fs.existsSync(stateFile)) return;

  if (dryRun) {
    console.log(`[DRY RUN] Would remove import state file: ${stateFile}`);
    return;
  }

  fs.unlinkSync(stateFile);
  console.log(`Removed import state file: ${stateFile}`);
}

async function run() {
  console.log("=== Medusa Catalog Wipe (Products / Collections / Categories) ===");
  console.log(`Medusa backend: ${medusaUrl}`);
  console.log(`Dry run: ${dryRun}`);

  // Delete products first so relationship constraints are less likely to block.
  const productIds = await pagedList("/admin/products", "products");
  await deleteMany("Products", productIds, (id) => `/admin/products/${id}`);

  // Collections are used by your admin portal routes.
  const collectionIds = await pagedList("/admin/collections", "collections");
  await deleteMany("Collections", collectionIds, (id) => `/admin/collections/${id}`);

  // Product categories may exist and are used by the storefront as a preferred source.
  const categoryIds = await pagedList("/admin/product-categories", "product_categories");
  await deleteMany("Product categories", categoryIds, (id) => `/admin/product-categories/${id}`);

  await removeImporterState();

  console.log("Catalog wipe complete.");
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
