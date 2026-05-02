# Phase 7 Runbook: QA, Cutover, Hypercare, Rollback

## 1) Preconditions

- Phase 1-6 complete and deployed to staging and production candidates.
- Medusa catalog parity validated using the parity report.
- Admin secret and Medusa admin token configured.
- Rollback values prepared in secure vault:
   - Previous known-good Medusa frontend+backend release versions.
   - Previous known-good environment variable snapshot.

## 2) Validation Commands

Run these against live Medusa backend and production frontend URL:

1. Customer journey validation:
   - npm run phase7:journey
2. Load/performance smoke:
   - npm run phase7:load
3. Security smoke:
   - npm run phase7:security

Gate for cutover:

- Journey script all checks pass.
- Load script passes success-rate and latency thresholds.
- Security script all checks pass.

## 3) Final Delta Migration

Run the final catalog delta before traffic switch:

1. Dry run:
   - DRY_RUN=true DELTA_SINCE=2026-04-20T00:00:00Z npm run medusa:import:delta
2. Live run:
   - DRY_RUN=false DELTA_SINCE=2026-04-20T00:00:00Z npm run medusa:import:delta
3. Validate parity:
   - npm run medusa:validate:parity

## 4) Cutover

1. Set NEXT_PUBLIC_COMMERCE_PROVIDER=medusa in production.
2. Deploy frontend and backend config atomically.
3. Run customer journey script immediately after deploy.
4. Enable hypercare monitor:
   - HYPERCARE_ITERATIONS=72 HYPERCARE_INTERVAL_MS=3600000 npm run phase7:hypercare

## 5) 72-Hour Hypercare Checklist

- Monitor:
  - API error rates and 5xx spikes.
  - Login and account order-history failures.
  - Cart mutation failures and checkout abandonment changes.
  - p95 latency and page availability.
- Review logs:
  - scripts/phase7/hypercare-log.jsonl
  - logs/admin-audit.log

## 6) Rollback Plan (Ready at all times)

Trigger rollback if severe incident threshold is crossed.

1. Re-deploy the previous stable Medusa frontend+backend release.
2. Restore previous stable environment values.
3. Pause write operations if data integrity is at risk until RCA.
4. Confirm storefront recovery via journey script.

## 7) Post-Stability Decommission

After 72 hours of stable operation with no Sev-1/Sev-2 incidents:

1. Remove Shopify debug routes.
2. Remove Shopify fallback code paths.
3. Remove Shopify env vars and secrets from runtime.
4. Keep migration scripts archived for audit only.
