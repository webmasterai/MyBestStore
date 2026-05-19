#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "[medusa] ERROR: DATABASE_URL is not set. Cannot run migrations."
  exit 1
fi

echo "[medusa] Running database migrations..."
npx medusa db:migrate

echo "[medusa] Starting server..."
exec "$@"
