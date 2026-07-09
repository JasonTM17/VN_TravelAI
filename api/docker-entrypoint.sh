#!/bin/sh
set -e
if [ -n "$DATABASE_URL" ]; then
  ./node_modules/.bin/prisma migrate deploy || true
  if [ "${RUN_SEED:-true}" = "true" ]; then
    ./node_modules/.bin/tsx prisma/seed.ts || node --import tsx prisma/seed.ts || true
  fi
fi
exec node dist/main.js
