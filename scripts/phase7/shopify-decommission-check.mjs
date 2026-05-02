import { loadEnv, nowIso } from "./_shared.mjs";

const env = loadEnv();

function main() {
  const result = {
    at: nowIso(),
    runtimeProvider: env.NEXT_PUBLIC_COMMERCE_PROVIDER || "",
    checks: [],
  };

  const add = (name, ok, details = {}) => {
    result.checks.push({ name, ok, ...details });
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  };

  add("provider-medusa", String(env.NEXT_PUBLIC_COMMERCE_PROVIDER).toLowerCase() === "medusa", {
    value: env.NEXT_PUBLIC_COMMERCE_PROVIDER,
  });

  add("shopify-store-domain-removed-or-empty", !env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, {
    valuePresent: Boolean(env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN),
  });

  add("shopify-token-removed-or-empty", !env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN, {
    valuePresent: Boolean(env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN),
  });

  add("shopify-store-url-removed-or-empty", !env.NEXT_PUBLIC_SHOPIFY_STORE_URL, {
    valuePresent: Boolean(env.NEXT_PUBLIC_SHOPIFY_STORE_URL),
  });

  const passed = result.checks.every((c) => c.ok);
  result.passed = passed;

  console.log(JSON.stringify(result, null, 2));
  if (!passed) process.exit(1);
}

main();
