# MyBestStore (Next.js Storefront + Medusa Backend)

This repository contains:

- **Storefront**: Next.js app (App Router) at repo root.
- **Backend**: Medusa v2 service in `backend/medusa-service/`.
- **Infrastructure**: PostgreSQL + Redis via Docker Compose in `backend/medusa/`.

The storefront runtime is **Medusa-only**:

- Home, product, collection, and search read flows use Medusa APIs.
- Cart lifecycle uses Medusa carts/session and line item APIs.
- Login/signup/account order history use Medusa customer APIs.
- Shopify runtime fallback and Shopify debug routes have been removed.

---

## Prerequisites

- **Node.js**: >= 20 (backend requires this). Using the same Node version for frontend+backend is recommended.
- **npm**: comes with Node.
- **Docker Desktop**: required for local PostgreSQL + Redis.

Ports used locally:

- Storefront: `http://localhost:3000`
- Medusa backend: `http://localhost:9000`
- Medusa admin: `http://localhost:9000/app`
- Postgres: `localhost:5433`
- Redis: `localhost:6380`

---

## Quick Start (Local Development)

### 1) Start Postgres + Redis

```bash
cd backend/medusa
docker compose up -d
```

### 2) Start Medusa backend (API + Admin)

```bash
cd backend/medusa-service
npm ci
npm run dev
```

Backend environment:

- `backend/medusa-service/.env.template` is the template.
- `backend/medusa-service/.env` is what the backend loads in dev.

The repo currently includes a local-dev `backend/medusa-service/.env` pointing to the Docker Compose services:

- `DATABASE_URL=postgres://medusa:medusa@localhost:5433/medusa_db`
- `REDIS_URL=redis://localhost:6380`

If you ever need to reset it, copy the template and fill values:

```bash
cd backend/medusa-service
# Windows (PowerShell / CMD)
copy .env.template .env

# macOS / Linux
cp .env.template .env
```

Then set `DATABASE_URL` and `REDIS_URL` to match your environment.

### 3) Start Next.js storefront

From repo root:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

---

## Frontend Environment Variables

Create a local env file from the template:

```bash
# Windows (PowerShell / CMD)
copy .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Minimum required for the storefront to run:

```bash
NEXT_PUBLIC_COMMERCE_PROVIDER=medusa
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_medusa_publishable_key_here
```

Where to get the Medusa values:

- Start the backend and open Medusa Admin at `http://localhost:9000/app`.
- Create/sign in as an admin user.
- Create a **Publishable API key** and use its token as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.
- Create an **Admin API token** (Bearer token) and use it as `MEDUSA_ADMIN_API_TOKEN` for scripts/admin routes.
- If you use regions, copy the region ID from the Regions screen into `NEXT_PUBLIC_MEDUSA_REGION_ID`.

Recommended/optional:

```bash
# improves pricing consistency if your Medusa setup is region-based
NEXT_PUBLIC_MEDUSA_REGION_ID=

# used by the in-app admin routes in this Next.js app
ADMIN_PORTAL_SECRET=replace_with_long_random_secret

# where the Medusa Admin UI is hosted
NEXT_PUBLIC_MEDUSA_ADMIN_URL=http://localhost:9000/app
```

Admin integration (server-side only):

```bash
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_API_TOKEN=your_medusa_admin_token_here
MEDUSA_STORE_ID=
```

Phase 7 scripts (only needed if you run them):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

Security note:

- **Do not share secrets in zipped copies.** `.env.local` is ignored by git, but if you zip the folder it may still be included.
- Prefer sharing `.env.example` and having the recipient create `.env.local` locally.

---

## Admin Workflows (Next.js Admin Portal)

This repo includes a lightweight admin UI under the storefront:

- `/admin/products`
- `/admin/categories`
- `/admin/orders`
- `/admin/content`

All Next.js admin API routes require the header:

- `x-admin-secret: <ADMIN_PORTAL_SECRET>`

Routes:

- `GET|POST /api/admin/products`
- `PATCH|DELETE /api/admin/products/:id`
- `GET|POST /api/admin/categories`
- `PATCH|DELETE /api/admin/categories/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id`
- `GET|PUT /api/admin/cms/homepage`

---

## Medusa Bootstrap + Migration Utilities (Non-Runtime)

These scripts live in `scripts/` and are intended for setup/migration/QA only.

### Phase 2: Bootstrap (regions/key/users)

Prereqs:

- Medusa backend is running.
- `MEDUSA_BACKEND_URL` and `MEDUSA_ADMIN_API_TOKEN` are configured in `.env.local`.

Run:

```bash
npm run medusa:bootstrap
```

Dry-run mode:

```bash
DRY_RUN=true npm run medusa:bootstrap
```

### Phase 3: Shopify -> Medusa import

Required env vars for the importer (in `.env.local` at repo root):

```bash
# Shopify source
SHOPIFY_ADMIN_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your_shopify_admin_api_token

# Medusa target
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_API_TOKEN=your_medusa_admin_token_here

# Optional (used by some flows)
MEDUSA_REGION_ID=
MEDUSA_ADMIN_EMAIL=
MEDUSA_ADMIN_PASSWORD=
```

Dry run first:

```bash
DRY_RUN=true npm run medusa:import:shopify
```

Live run:

```bash
DRY_RUN=false npm run medusa:import:shopify
```

Delta import:

```bash
DRY_RUN=true DELTA_SINCE=2026-04-20T00:00:00Z npm run medusa:import:delta
DRY_RUN=false DELTA_SINCE=2026-04-20T00:00:00Z npm run medusa:import:delta
```

Parity validation:

```bash
npm run medusa:validate:parity
```

Notes:

- Import state is stored in `scripts/medusa/import-state.json`.
- Parity report outputs to `scripts/medusa/parity-report.json`.

---

## Phase 7 (QA + Hypercare)

```bash
npm run phase7:journey
npm run phase7:load
npm run phase7:security
HYPERCARE_ITERATIONS=72 HYPERCARE_INTERVAL_MS=3600000 npm run phase7:hypercare
npm run phase7:decommission-check
```

Note: `phase7:decommission-check` expects Shopify runtime vars to be unset/empty (for example `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `NEXT_PUBLIC_SHOPIFY_STORE_URL`).

Runbook: `scripts/phase7/CUTOVER-HYPERCARE.md`

---

## Deployment

This is a two-service deploy (storefront + backend), plus managed Postgres/Redis.

### Deploy the Medusa backend

High-level steps:

1. Provision PostgreSQL and Redis (or run equivalents in containers).
2. Set backend env vars (at least `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, plus CORS values).
3. Build + start:

```bash
cd backend/medusa-service
npm ci
npm run build
npm run start
```

Important production settings (examples):

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB
REDIS_URL=redis://HOST:6379

STORE_CORS=https://your-storefront-domain.com
ADMIN_CORS=https://your-backend-domain.com,https://your-backend-domain.com/app
AUTH_CORS=https://your-storefront-domain.com,https://your-backend-domain.com

JWT_SECRET=replace_with_long_random_secret
COOKIE_SECRET=replace_with_long_random_secret
```

### Deploy the Next.js storefront

Build + start:

```bash
npm ci
npm run build
npm run start
```

Set these env vars in your hosting provider:

- `NEXT_PUBLIC_COMMERCE_PROVIDER=medusa`
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend-domain.com`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=...`
- `NEXT_PUBLIC_MEDUSA_REGION_ID=...` (if used)

If you deploy the Next.js admin routes, also configure:

- `ADMIN_PORTAL_SECRET=...`
- `MEDUSA_ADMIN_API_TOKEN=...` (server-side only)

---

## Packaging / Zipping (without node_modules)

Before zipping and sharing the project, remove build and dependency artifacts:

- `node_modules/`
- `.next/`
- `backend/medusa-service/node_modules/`

Also consider excluding local env files that may contain secrets:

- `.env.local`
- `backend/medusa-service/.env` (if it contains non-default credentials)

Prefer sharing templates instead:

- `.env.example`
- `backend/medusa-service/.env.template`

---

## Troubleshooting

- If the storefront crashes with “Missing `NEXT_PUBLIC_MEDUSA_BACKEND_URL`” or “Missing `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`”, ensure `.env.local` exists and values are set.
- If requests fail with CORS errors, update `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS` in `backend/medusa-service/.env` (or production env) to include the storefront origin.
- If `/api/admin/*` routes return 401/403, ensure you’re sending `x-admin-secret` matching `ADMIN_PORTAL_SECRET`.

---

## Runbooks

- Backend infra + migration notes: `backend/medusa/README.md`
- Phase 7 cutover/hypercare: `scripts/phase7/CUTOVER-HYPERCARE.md`
