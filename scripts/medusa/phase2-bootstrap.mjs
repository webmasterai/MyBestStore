import { loadEnv, normalizeUrl, requireEnv } from "./_utils.mjs";

const env = loadEnv();
const dryRun = String(env.DRY_RUN || "false").toLowerCase() === "true";

const medusaBackendUrl = env.MEDUSA_BACKEND_URL || env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const medusaUrl = normalizeUrl(medusaBackendUrl);
const adminToken = env.MEDUSA_ADMIN_API_TOKEN;

requireEnv(
  {
    ...env,
    MEDUSA_BACKEND_URL: medusaBackendUrl,
  },
  ["MEDUSA_BACKEND_URL", "MEDUSA_ADMIN_API_TOKEN"]
);

async function adminRequest(path, init = {}) {
  const res = await fetch(`${medusaUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${adminToken}`,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Medusa admin request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function ensureRegionPKR() {
  const list = await adminRequest("/admin/regions?limit=100");
  const existing = (list.regions || []).find(
    (r) => (r.currency_code || "").toLowerCase() === "pkr"
  );

  if (existing) {
    console.log(`Region already exists for PKR: ${existing.id}`);
    return existing;
  }

  if (dryRun) {
    console.log("[DRY RUN] Would create PKR region for Pakistan");
    return null;
  }

  const created = await adminRequest("/admin/regions", {
    method: "POST",
    body: JSON.stringify({
      name: "Pakistan",
      currency_code: "pkr",
      countries: ["pk"],
      payment_providers: ["pp_system_default"],
      fulfillment_providers: ["manual_manual"],
    }),
  });

  console.log(`Created PKR region: ${created.region?.id || "(unknown)"}`);
  return created.region || null;
}

async function ensureDefaultShippingOption(region) {
  if (!region?.id) {
    console.log("Skipping shipping option setup (region unavailable)");
    return;
  }

  try {
    const profileResp = await adminRequest("/admin/shipping-profiles?limit=20");
    const profile = (profileResp.shipping_profiles || [])[0];
    if (!profile?.id) {
      console.log("No shipping profile found; skipping shipping option setup.");
      return;
    }

    const locationResp = await adminRequest("/admin/stock-locations?limit=20");
    const location = (locationResp.stock_locations || [])[0];
    if (!location?.id) {
      console.log("No stock location found; skipping shipping option setup.");
      return;
    }

    if (dryRun) {
      console.log("[DRY RUN] Would create default manual shipping option for PKR region");
      return;
    }

    await adminRequest("/admin/shipping-options", {
      method: "POST",
      body: JSON.stringify({
        name: "Standard Delivery",
        service_zone_id: region.service_zones?.[0]?.id,
        shipping_profile_id: profile.id,
        provider_id: "manual_manual",
        type: {
          label: "Flat",
          description: "Standard flat shipping",
          code: "flat",
        },
        prices: [
          {
            amount: 25000,
            currency_code: "pkr",
          },
        ],
        rules: [],
        data: {
          stock_location_id: location.id,
        },
      }),
    });

    console.log("Default shipping option created.");
  } catch (err) {
    console.log(`Shipping setup skipped: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function ensurePublishableKey() {
  const existing = await adminRequest("/admin/publishable-api-keys?limit=100");
  const key = (existing.publishable_api_keys || []).find(
    (k) => k.title === "mybeststore-storefront"
  );

  if (key) {
    console.log(`Publishable key already exists: ${key.id}`);
    return key;
  }

  if (dryRun) {
    console.log("[DRY RUN] Would create publishable key: mybeststore-storefront");
    return null;
  }

  const created = await adminRequest("/admin/publishable-api-keys", {
    method: "POST",
    body: JSON.stringify({
      title: "mybeststore-storefront",
    }),
  });

  console.log(`Publishable key created: ${created.publishable_api_key?.id || "(unknown)"}`);
  return created.publishable_api_key || null;
}

async function ensureBusinessUsers() {
  const users = [
    { email: env.BUSINESS_ADMIN_EMAIL, first_name: "Business", last_name: "Admin" },
    { email: env.BUSINESS_OPERATIONS_EMAIL, first_name: "Operations", last_name: "Manager" },
  ].filter((u) => Boolean(u.email));

  if (!users.length) {
    console.log("No BUSINESS_* emails configured. Skipping user invitations.");
    return;
  }

  for (const user of users) {
    if (dryRun) {
      console.log(`[DRY RUN] Would invite admin user: ${user.email}`);
      continue;
    }

    try {
      await adminRequest("/admin/invites", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        }),
      });
      console.log(`Invited admin user: ${user.email}`);
    } catch (err) {
      console.log(`Invite skipped for ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function run() {
  console.log("=== Phase 2 Bootstrap: Medusa Core Backend ===");
  console.log(`Medusa backend: ${medusaUrl}`);
  console.log(`Dry run: ${dryRun}`);

  const region = await ensureRegionPKR();
  await ensureDefaultShippingOption(region);
  await ensurePublishableKey();
  await ensureBusinessUsers();

  console.log("Phase 2 bootstrap complete.");
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
