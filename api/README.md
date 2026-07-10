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
| ADMIN_REINDEX_TOKEN | no* | — | Required for `POST /v1/admin/reindex` (min 16 chars). Pair with user Bearer JWT + header `X-Admin-Token`. |

\*Required only when calling admin reindex; boot-time reindex does not need it.

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
# search uniqueness (api + meili up after reseed/reindex):
node ../scripts/check-search-unique.mjs http://127.0.0.1:53001 Hoi
```

## Runbook

- **Reindex Meilisearch (clean rebuild):**  
  `POST /v1/admin/reindex` with `Authorization: Bearer <user JWT>` and `X-Admin-Token: <ADMIN_REINDEX_TOKEN>`.  
  Implementation deletes and recreates `destinations` / `hotels` / `tours` indexes so reseeded UUIDs never leave stale hits.
- **Reseed catalog:** `pnpm seed` then wait for boot reindex (~5s) or call admin reindex.
- **Reset DB:** drop `travelai` database and migrate again

