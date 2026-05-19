#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "[medusa] ERROR: DATABASE_URL is not set. Cannot run migrations."
  exit 1
fi

# In-compose Postgres does not use TLS; avoid SSL unless explicitly enabled.
if [ "${DATABASE_SSL:-false}" != "true" ] && [ "${DATABASE_SSL:-false}" != "1" ]; then
  export PGSSLMODE=disable
fi

echo "[medusa] Running database migrations..."
npx medusa db:migrate

echo "[medusa] Starting server..."
exec "$@"
