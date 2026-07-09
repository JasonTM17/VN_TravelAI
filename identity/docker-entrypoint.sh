#!/bin/sh
set -e
if [ -n "$DATABASE_URL" ]; then
  ./node_modules/.bin/prisma migrate deploy || true
fi
exec node dist/main.js
