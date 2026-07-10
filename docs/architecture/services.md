# Services overview

**Last verified:** `e715b96`

## Application services

### web

| Field | Value |
|-------|-------|
| Path | `web/` |
| Stack | Next.js 15 App Router, React 19, Tailwind 4 |
| Role | Customer UI SSR + client components |
| Public ports local | **53000** |
| Health | `GET /healthz`, `/readyz`, `/metrics` |
| Depends on | identity, api, ai (HTTP) |
| README | [web/README.md](../../web/README.md) |

### api

| Field | Value |
|-------|-------|
| Path | `api/` |
| Stack | Fastify 5, Prisma, Zod, Meili client, Redis |
| Role | Catalog, search, bookings, wishlist, promos, admin |
| Public ports local | **53001** |
| Depends on | postgres (catalog), redis, meilisearch, identity JWKS |
| README | [api/README.md](../../api/README.md) |

### identity

| Field | Value |
|-------|-------|
| Path | `identity/` |
| Stack | Fastify 5, Prisma, jose (Ed25519), Redis |
| Role | Register/login/refresh/logout/me/password, JWKS |
| Public ports local | **53002** |
| Depends on | postgres (identity), redis |
| README | [identity/README.md](../../identity/README.md) |

### ai

| Field | Value |
|-------|-------|
| Path | `ai/` |
| Stack | Fastify 5, Redis, HMAC, JWKS verify |
| Role | Chat + itinerary orchestrator |
| Public ports local | **53003** |
| Depends on | redis, identity JWKS, webhook base URL |
| README | [ai/README.md](../../ai/README.md) |

## Data plane

| Service | Image (compose) | Role | App usage |
|---------|-----------------|------|-----------|
| postgres | postgres:16-alpine | 2 databases | CONFIRMED |
| redis | redis:7 | rate limits | CONFIRMED |
| meilisearch | getmeili/meilisearch:v1.11 | search | CONFIRMED |
| minio | minio | object storage | DISCONNECTED |
| n8n | n8nio/n8n | workflows | PARTIAL (local prefers chat-webhook) |
| chat-webhook | node script | DeepSeek stand-in | local overlay only |

## Image registries

| Registry | Pattern |
|----------|---------|
| Docker Hub | `nguyenson1710/travelai-{web,api,identity,ai}` |
| GHCR | `ghcr.io/jasontm17/travelai-{web,api,identity,ai}` |

## Related

- [Data flows](./data-flows.md)
- [Docker](../docker/overview.md)
