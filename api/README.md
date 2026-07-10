# api

## Purpose

Catalog, Meilisearch, vector embeddings, bookings (incl. hotel PMS), reviews, notifications, wishlists, chat history, and itinerary persistence for TravelAI. Called by `web` and `ai`. Verifies JWTs via identity JWKS.

## API surface

- Destinations / hotels (room types + rate plans) / tours / flights / transport
- Hotel night availability calendar
- Unified `/v1/search` + `/v1/search/vectors`
- Bookings lifecycle + mock pay + inventory
- Reviews · notifications · wishlists · chat history
- Admin Meili reindex · vector reindex · audit
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
| ADMIN_REINDEX_TOKEN | no* | — | Dual factor for admin reindex endpoints (min 16 chars) + `X-Admin-Token` |
| SMTP_URL / SMTP_HOST / … | no | log-only | Mailer (see `.env.example`) |
| EMBEDDING_* / PINECONE_* | no | local hash + PG | Vector backend |
| METRICS_TOKEN | no | open | Gate `/metrics` when set |

\*Required only when `ADMIN_REINDEX_TOKEN` is configured; boot-time Meili reindex does not need it.

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
# or: node ./node_modules/vitest/vitest.mjs run
# search uniqueness (api + meili up after reseed/reindex):
node ../scripts/check-search-unique.mjs http://127.0.0.1:53001 Hoi
```

Coverage target: lines ≥ 80% (project gate aspirational for CI).

## Runbook

- **Reindex Meilisearch:** `POST /v1/admin/reindex` with admin Bearer + optional `X-Admin-Token`.
- **Reindex vectors:** `POST /v1/admin/reindex-vectors` (same auth).
- **Reseed catalog (incl. PMS room types):** `pnpm seed` then reindex.
- **Mailer modes:** empty SMTP → log; `smtp://` or host config → nodemailer; `http(s)://` → JSON gateway.
- **Reset DB:** drop `travelai` database and migrate again.
