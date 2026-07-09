# api

## Purpose

Catalog, search (Meilisearch), bookings, wishlists, and itinerary persistence for TravelAI.
Called by `web` and `ai`. Verifies JWTs via identity JWKS.

## API surface

- Destinations / hotels / tours / flights search
- Unified `/v1/search`
- Bookings lifecycle + mock pay
- Wishlists
- `/v1/itineraries/persist`
- `/healthz` · `/readyz` · `/metrics`

Canonical contract: [`docs/openapi.yaml`](../docs/openapi.yaml).

## Env vars

| name | required | default | description |
|------|----------|---------|-------------|
| PORT | no | 3001 | HTTP port |
| DATABASE_URL | yes | — | Postgres catalog DB |
| MEILI_HOST | no | http://127.0.0.1:7700 | Meilisearch |
| MEILI_MASTER_KEY | no | dev key | Meilisearch key |
| IDENTITY_JWKS_URL | yes | — | JWKS endpoint |
| CORS_ORIGINS | no | http://localhost:3000 | Allowed origins |

## Run locally

```bash
pnpm install
pnpm prisma:dev
pnpm seed
pnpm dev
```

## Test

```bash
pnpm test
```

## Runbook

- **Reindex Meilisearch:** `POST /v1/admin/reindex`
- **Reseed catalog:** `pnpm seed` then reindex
- **Reset DB:** drop `travelai` database and migrate again
