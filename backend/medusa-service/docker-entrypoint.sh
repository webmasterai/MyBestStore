#!/bin/sh
set -e
echo "[medusa] Running database migrations..."
npx medusa db:migrate
echo "[medusa] Starting server..."
exec "$@"
