# MyBestStore Frontend (Medusa Runtime)

This storefront now runs on a Medusa-only runtime path.

## Runtime Status

- Home, product, collection, and search read flows use Medusa APIs.
- Cart lifecycle uses Medusa carts/session and line item APIs.
- Login/signup/account order history use first-party Medusa customer APIs.
- Shopify runtime fallback and Shopify debug routes have been removed.

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_COMMERCE_PROVIDER=medusa
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_medusa_publishable_key_here
NEXT_PUBLIC_MEDUSA_REGION_ID=

MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_API_TOKEN=your_medusa_admin_token_here
MEDUSA_STORE_ID=

ADMIN_PORTAL_SECRET=replace_with_long_random_secret
NEXT_PUBLIC_MEDUSA_ADMIN_URL=http://localhost:9000/app

# for phase7 live checks
NEXT_PUBLIC_SITE_URL=http://localhost:3000
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

## Admin Workflows

All admin APIs require `x-admin-secret` matching `ADMIN_PORTAL_SECRET`.

- `GET|POST /api/admin/products`
- `PATCH|DELETE /api/admin/products/:id`
- `GET|POST /api/admin/categories`
- `PATCH|DELETE /api/admin/categories/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id`
- `GET|PUT /api/admin/cms/homepage`

In-app admin UI:

- `/admin/products`
- `/admin/categories`
- `/admin/orders`
- `/admin/content`

All edit/delete operations use explicit yes/no confirmation prompts.

## Migration Utilities (Non-Runtime)

Shopify-to-Medusa scripts remain available for migration and parity checks only.

```bash
npm run medusa:bootstrap
DRY_RUN=true npm run medusa:import:shopify
DRY_RUN=false npm run medusa:import:shopify
DRY_RUN=true DELTA_SINCE=2026-04-20T00:00:00Z npm run medusa:import:delta
DRY_RUN=false DELTA_SINCE=2026-04-20T00:00:00Z npm run medusa:import:delta
npm run medusa:validate:parity
```

## Phase 7 (QA + Hypercare)

```bash
npm run phase7:journey
npm run phase7:load
npm run phase7:security
HYPERCARE_ITERATIONS=72 HYPERCARE_INTERVAL_MS=3600000 npm run phase7:hypercare
npm run phase7:decommission-check
```

Runbook:

- `scripts/phase7/CUTOVER-HYPERCARE.md`

Backend runbook:

- `backend/medusa/README.md`
