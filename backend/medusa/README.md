# Medusa Backend Workspace

This folder contains infrastructure and runbook for Phase 2 (Medusa core backend) and Phase 3 (Shopify -> Medusa migration pipeline).

## 1) Start Infrastructure (PostgreSQL + Redis)

```bash
cd backend/medusa
docker compose up -d
```

## 2) Initialize Medusa Service

This repo already includes the Medusa service in `backend/medusa-service/`.

Install and run it:

```bash
cd backend/medusa-service
npm ci
npm run dev
```

It is configured (by default) to use the infrastructure started in step 1:

- Postgres: `postgres://medusa:medusa@localhost:5433/medusa_db`
- Redis: `redis://localhost:6380`

Environment file:

- `backend/medusa-service/.env.template` (template)
- `backend/medusa-service/.env` (loaded in dev)

## 3) Required Environment Variables (repo root)

Add these to `.env.local` (or shell env) before running phase scripts:

```bash
# Medusa admin access
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_API_TOKEN=your_medusa_admin_api_token

# Optional storefront equivalents
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_MEDUSA_REGION_ID=your_region_id

# Shopify source for migration
SHOPIFY_ADMIN_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your_shopify_admin_api_token

# Optional invites
BUSINESS_ADMIN_EMAIL=admin@mybeststore.pk
BUSINESS_OPERATIONS_EMAIL=ops@mybeststore.pk
```

## 4) Phase 2 Bootstrap (Core Backend Setup)

From repo root:

```bash
npm run medusa:bootstrap
```

What this does:
- ensures PKR region setup
- attempts default shipping option bootstrapping
- ensures publishable API key exists
- invites business admin users if email env vars are set

Dry run mode:

```bash
DRY_RUN=true npm run medusa:bootstrap
```

## 5) Phase 3 Import Pipeline (Shopify -> Medusa)

Dry run first:

```bash
DRY_RUN=true npm run medusa:import:shopify
```

Live run:

```bash
DRY_RUN=false npm run medusa:import:shopify
```

Importer behavior:
- imports collections first as Medusa product categories
- imports products/variants/images
- preserves product handles/slugs
- stores migration state in `scripts/medusa/import-state.json`

## 6) Parity Validation (Dry Migration Validation)

```bash
npm run medusa:validate:parity
```

Outputs report:
- `scripts/medusa/parity-report.json`

Includes:
- product count parity
- category count parity
- per-product variant count and first-price/inventory comparison
- image/media count parity

## Notes

- Scripts are designed for idempotent reruns where possible.
- Medusa API surfaces may vary by version; adjust endpoint payload fields if your version differs.
