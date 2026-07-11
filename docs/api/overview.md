# API overview

**Purpose:** Inventory HTTP surface. Canonical contract: [`../openapi.yaml`](../openapi.yaml).  
**Last verified:** `a796b94` (2026-07-11)

## Base URLs (local overlay)

| Service | Base |
|---------|------|
| api | `http://localhost:53001` |
| identity | `http://localhost:53002` |
| ai | `http://localhost:53003` |

## identity

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/v1/auth/register` | no | Zod |
| POST | `/v1/auth/login` | no | lockout + RL; refresh → **httpOnly cookie** |
| POST | `/v1/auth/refresh` | cookie (± body if explicitly allowed) | atomic single-use rotation; concurrent replay rejected |
| POST | `/v1/auth/logout` | cookie / body | revoke |
| GET | `/v1/auth/me` | Bearer | |
| POST | `/v1/auth/change-password` | Bearer | revokes refresh |
| GET | `/.well-known/jwks.json` | no | dual keys |
| GET | `/healthz` `/readyz` `/metrics` | metrics optional token | |

## api

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/v1/destinations` `/:slug` | no | |
| GET | `/v1/hotels` `/:slug` | no | detail includes `roomTypes` + `ratePlans` |
| GET | `/v1/hotels/:slug/availability` | no | night calendar; optional `roomTypeId` |
| GET | `/v1/tours` `/:slug` | no | |
| GET | `/v1/flights/search` | no | seed inventory |
| GET | `/v1/transports` `/:slug` | no | bookable via bookings |
| GET | `/v1/search` | no | Meili multi-index |
| GET | `/v1/search/vectors` | no | semantic hits + context string |
| GET | `/v1/promos` | no | |
| GET/POST | `/v1/reviews` | POST Bearer | hotel/tour reviews |
| GET/POST | `/v1/bookings` | Bearer | optional `roomTypeId`/`ratePlanId`; Idempotency-Key rejects payload mismatch |
| POST | `/v1/bookings/:id/pay` | Bearer | atomic **MOCK** outcome + one inventory decrement + notify |
| POST | `/v1/bookings/:id/cancel` | Bearer | atomic transition; restore inventory once if confirmed |
| GET | `/v1/notifications` | Bearer | in-app/email status |
| GET/POST/DELETE | `/v1/wishlists` | Bearer | |
| POST/GET | `/v1/itineraries` persist paths | Bearer | |
| GET/POST | `/v1/chat/conversations` messages | Bearer | chat history |
| POST | `/v1/admin/reindex` | admin + optional X-Admin-Token | Meili |
| POST | `/v1/admin/reindex-vectors` | admin + optional token | embeddings |
| GET | `/v1/admin/audit` | admin | |
| GET | `/healthz` `/readyz` `/metrics` | metrics optional token | |

## ai

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/v1/chat` | Bearer | Redis RL + HMAC webhook/tools, or degraded; no direct RAG |
| POST | `/v1/chat/stream` | Bearer | shared Redis RL + direct DeepSeek + catalog RAG; SSE `meta`, zero+ `token`, `done`; no webhook tools |
| POST/GET | `/v1/itineraries` `/:id` | Bearer | Map + optional persist |
| POST | `/v1/hooks/n8n-callback` | HMAC | exact raw bytes; acceptance probe only, not result ingestion |
| GET | `/healthz` `/readyz` `/metrics` | metrics optional token | |

Booking dates currently validate the `YYYY-MM-DD` shape, not strict real-calendar dates. Hotel stay enumeration falls back to one night for missing/non-increasing end dates and caps at 61 nights; clients should not rely on this as a production stay-policy contract.

## Client usage

- Runtime web: `web/src/lib/api.ts` (hand-written + cookie refresh)  
- Generated: `web/src/generated/openapi.ts` (`pnpm generate:api` in web)  
- Lint: Redocly `redocly.yaml` in CI job `openapi`

## Related

- Per-service READMEs
- [Security](../security/overview.md)
- [Database](../database/overview.md)
