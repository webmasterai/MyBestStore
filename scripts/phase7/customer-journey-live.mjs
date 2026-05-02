import { loadEnv, requireEnv, nowIso, jsonFetch } from "./_shared.mjs";

const env = loadEnv();
const report = {
  startedAt: nowIso(),
  checks: [],
  passed: false,
};

function addCheck(name, ok, details = {}) {
  report.checks.push({ name, ok, at: nowIso(), ...details });
  if (!ok) {
    console.error(`FAIL: ${name}`);
  } else {
    console.log(`PASS: ${name}`);
  }
}

async function run() {
  requireEnv(env, [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL",
    "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    "E2E_TEST_EMAIL",
    "E2E_TEST_PASSWORD",
  ]);

  const siteUrl = String(env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
  const medusaStore = String(env.NEXT_PUBLIC_MEDUSA_BACKEND_URL).replace(/\/$/, "");
  const apiKey = env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  const email = env.E2E_TEST_EMAIL;
  const password = env.E2E_TEST_PASSWORD;

  const browseHome = await fetch(`${siteUrl}/`, { redirect: "follow" });
  addCheck("browse-home", browseHome.ok, { status: browseHome.status });

  const browseSearch = await fetch(`${siteUrl}/search?q=test`, { redirect: "follow" });
  addCheck("browse-search", browseSearch.ok, { status: browseSearch.status });

  const loginRes = await jsonFetch(`${siteUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  addCheck("auth-login", loginRes.res.ok, {
    status: loginRes.res.status,
    response: loginRes.json,
  });

  const meRes = await jsonFetch(`${siteUrl}/api/auth/me`, {
    headers: {
      cookie: loginRes.res.headers.get("set-cookie") || "",
    },
  });
  addCheck("auth-me", meRes.res.ok, { status: meRes.res.status });

  const productsRes = await jsonFetch(
    `${medusaStore}/store/products?limit=1&fields=*variants,*variants.calculated_price,+thumbnail,+images`,
    {
      headers: {
        "x-publishable-api-key": apiKey,
      },
    }
  );

  const firstProduct = productsRes.json?.products?.[0];
  const firstVariant = firstProduct?.variants?.[0];
  addCheck("catalog-product-available", Boolean(firstVariant?.id), {
    productId: firstProduct?.id || null,
    variantId: firstVariant?.id || null,
  });

  const cartCreate = await jsonFetch(`${medusaStore}/store/carts`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": apiKey,
    },
    body: JSON.stringify(
      env.NEXT_PUBLIC_MEDUSA_REGION_ID
        ? { region_id: env.NEXT_PUBLIC_MEDUSA_REGION_ID }
        : {}
    ),
  });

  const cartId = cartCreate.json?.cart?.id;
  addCheck("cart-create", Boolean(cartId), {
    status: cartCreate.res.status,
    cartId: cartId || null,
  });

  if (cartId && firstVariant?.id) {
    const addLine = await jsonFetch(`${medusaStore}/store/carts/${cartId}/line-items`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-publishable-api-key": apiKey,
      },
      body: JSON.stringify({ variant_id: firstVariant.id, quantity: 1 }),
    });

    const lineId = addLine.json?.cart?.items?.[0]?.id;
    addCheck("cart-add-line", addLine.res.ok && Boolean(lineId), {
      status: addLine.res.status,
      lineId: lineId || null,
    });

    if (lineId) {
      const updateLine = await jsonFetch(
        `${medusaStore}/store/carts/${cartId}/line-items/${lineId}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-publishable-api-key": apiKey,
          },
          body: JSON.stringify({ quantity: 2 }),
        }
      );

      addCheck("cart-update-line", updateLine.res.ok, { status: updateLine.res.status });

      const removeLine = await jsonFetch(
        `${medusaStore}/store/carts/${cartId}/line-items/${lineId}`,
        {
          method: "DELETE",
          headers: {
            "x-publishable-api-key": apiKey,
          },
        }
      );

      addCheck("cart-remove-line", removeLine.res.ok, { status: removeLine.res.status });
    }
  }

  const checkoutPage = await fetch(`${siteUrl}/checkout`, { redirect: "follow" });
  addCheck("checkout-route", checkoutPage.ok, { status: checkoutPage.status });

  const ordersRes = await jsonFetch(`${siteUrl}/api/auth/orders`, {
    headers: {
      cookie: loginRes.res.headers.get("set-cookie") || "",
    },
  });
  addCheck("account-order-history", ordersRes.res.ok, {
    status: ordersRes.res.status,
    ordersCount: Array.isArray(ordersRes.json?.orders) ? ordersRes.json.orders.length : null,
  });

  report.passed = report.checks.every((c) => c.ok);
  report.completedAt = nowIso();

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exit(1);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
