import { loadEnv, requireEnv, jsonFetch, nowIso } from "./_shared.mjs";

const env = loadEnv();

async function run() {
  requireEnv(env, ["NEXT_PUBLIC_SITE_URL"]);
  const siteUrl = String(env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");

  const checks = [];
  const add = (name, ok, details = {}) => {
    checks.push({ name, ok, at: nowIso(), ...details });
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  };

  const unauthorizedProducts = await jsonFetch(`${siteUrl}/api/admin/products`, {
    method: "GET",
  });
  add("admin-endpoints-unauthorized-without-secret", unauthorizedProducts.res.status === 401, {
    status: unauthorizedProducts.res.status,
  });

  const login = await jsonFetch(`${siteUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "invalid@example.com", password: "wrong" }),
  });
  add("invalid-login-rejected", login.res.status >= 400, { status: login.res.status });

  const headersRes = await fetch(`${siteUrl}/`);
  const xPoweredBy = headersRes.headers.get("x-powered-by");
  add("no-x-powered-by-header", !xPoweredBy, { xPoweredBy });

  const summary = {
    startedAt: nowIso(),
    checks,
    passed: checks.every((c) => c.ok),
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!summary.passed) process.exit(1);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
