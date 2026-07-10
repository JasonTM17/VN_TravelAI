# API overview

**Purpose:** Inventory HTTP surface. Canonical contract: [`../openapi.yaml`](../openapi.yaml).  
**Last verified:** `e715b96`

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
| POST | `/v1/auth/login` | no | lockout + RL |
| POST | `/v1/auth/refresh` | body refresh | rotate |
| POST | `/v1/auth/logout` | body refresh | revoke |
| GET | `/v1/auth/me` | Bearer | |
| POST | `/v1/auth/change-password` | Bearer | revokes refresh |
| GET | `/.well-known/jwks.json` | no | dual keys |
| GET | `/healthz` `/readyz` `/metrics` | no | |

## api

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/v1/destinations` `/:slug` | no | |
| GET | `/v1/hotels` `/:slug` | no | |
| GET | `/v1/tours` `/:slug` | no | |
| GET | `/v1/flights/search` | no | seed inventory |
| GET | `/v1/transports` `/:slug` | no | browse-only |
| GET | `/v1/search` | no | Meili |
| GET | `/v1/promos` | no | |
| GET/POST | `/v1/bookings` | Bearer | create + list |
| POST | `/v1/bookings/:id/pay` | Bearer | **MOCK** outcome |
| POST | `/v1/bookings/:id/cancel` | Bearer | state machine |
| GET/POST/DELETE | `/v1/wishlists` | Bearer | |
| POST/GET | `/v1/itineraries/persist` `/:id` | Bearer | |
| POST | `/v1/admin/reindex` | admin + optional token | |
| GET | `/v1/admin/audit` | admin | |
| GET | `/healthz` `/readyz` `/metrics` | no | |

## ai

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/v1/chat` | Bearer | webhook / degrade |
| POST/GET | `/v1/itineraries` `/:id` | Bearer | in-memory Map |
| POST | `/v1/hooks/n8n-callback` | HMAC | raw body |
| GET | `/healthz` `/readyz` `/metrics` | no | |

## Client usage

- Runtime web: `web/src/lib/api.ts` (hand-written + refresh)  
- Generated: `web/src/generated/openapi.ts` (regen script `pnpm generate:api` in web)  
- Lint: Redocly `redocly.yaml` in CI job `openapi`

## Related

- Per-service READMEs
- [Security](../security/overview.md)
