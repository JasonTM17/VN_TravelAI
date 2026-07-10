#!/bin/sh
set -e
if [ -n "$DATABASE_URL" ]; then
  ./node_modules/.bin/prisma migrate deploy
  if [ "${RUN_SEED:-false}" = "true" ]; then
    ./node_modules/.bin/tsx prisma/seed.ts || node --import tsx prisma/seed.ts
  fi
fi
exec node dist/main.js
