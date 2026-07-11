# Codebase summary — TravelAI

**Purpose:** Bản đồ monorepo cho onboarding.  
**Last verified:** `193b95e`

## 1. Hình dạng repo

**Service-split monorepo** (không phải single Next monolith API). Mỗi app có `package.json`, `pnpm-lock.yaml`, `Dockerfile`, `README.md` riêng. **Không** có root pnpm workspace.

```
VN_TravelAI/
├── web/           # Next.js 15 UI
├── api/           # Fastify catalog / booking / search / vectors / notifications
├── identity/      # Fastify auth + JWKS
├── ai/            # Fastify chat/itinerary + RAG orchestration
├── e2e/           # Playwright
├── scripts/       # smoke, DeepSeek helpers, audits
├── infra/         # postgres init, n8n workflow JSON
├── docs/          # ADR, OpenAPI, media, guides
├── docker-compose.yml
├── docker-compose.local.yml
└── docker-compose.prod.yml
```

> [!NOTE]
> ADR-0002 table có nhắc NestJS lịch sử; **implementation hiện tại là Fastify 5** (ADR-0003).

## 2. Stack (CONFIRMED)

| Layer | Tech | Path |
|-------|------|------|
| Web | Next.js 15.5.x, React 19, Tailwind 4 | `web/` |
| API / Identity / AI | Fastify 5, Zod, TypeScript, Node ≥22 | `api/`, `identity/`, `ai/` |
| ORM | Prisma 6 | `*/prisma/` |
| DB | PostgreSQL 16 (2 DBs) | compose |
| Cache / RL | Redis 7 | compose |
| Search | Meilisearch 1.11 | compose + `api/src/lib/meili.ts` |
| Vectors | local hash / OpenAI-compatible embed + Pinecone optional | `api/src/lib/embeddings.ts`, `vector-store.ts` |
| Mail | nodemailer SMTP / HTTP gateway / log | `api/src/lib/mailer.ts` |
| AI path | HMAC webhook → DeepSeek HTTP + tools | `scripts/lib/deepseek-travel-chat.mjs` |
| Contract | OpenAPI 3.1 | `docs/openapi.yaml` |
| Package mgr | pnpm (per-service locks) | `*/pnpm-lock.yaml` |

## 3. Service responsibilities

| Service | Role | Default container port | Local host (overlay) |
|---------|------|------------------------:|----------------------:|
| web | SSR/UI, booking UI, chatbot SSE | 3000 | 53000 |
| api | Catalog, Meili, vectors, bookings, PMS, reviews, notifications, admin | 3001 | 53001 |
| identity | Auth, JWKS, lockout, httpOnly refresh cookie | 3002 | 53002 |
| ai | Chat/SSE/itinerary → webhook + catalog RAG | 3003 | 53003 |
| postgres | catalog + identity DBs | 5432 | (local overlay maps) |
| redis | rate limits | 6379 | |
| meilisearch | full-text | 7700 | |
| n8n | workflow runtime (base compose) | 5678 | |
| chat-webhook | local DeepSeek stand-in | — | local overlay only |
| minio | object storage | 9000 | **DISCONNECTED** |

## 4. Entry points

| Service | Entry |
|---------|-------|
| web | `web/src/app/` App Router |
| api | `api/src/main.ts` |
| identity | `identity/src/main.ts` |
| ai | `ai/src/main.ts` |
| chat-webhook | `scripts/mock-n8n-webhook.mjs` |

## 5. Data stores

| Store | Models (high level) |
|-------|---------------------|
| `travelai` (api) | Destination, Hotel, HotelRoomType, RatePlan, HotelNightInventory, Tour, Flight, Transport, Review, Booking, PaymentAttempt, Wishlist, Itinerary, Promo, Notification, ChatConversation, ChatMessage, VectorDocument, AdminAuditLog |
| `travelai_identity` | User, RefreshToken |
| Meili indexes | destinations, hotels, tours (reindex admin/boot) |
| Vectors | Postgres `vector_documents` ± Pinecone index |
| Redis | rate-limit keys |
| ai memory | itinerary `Map` in-process (lost on restart; optional DB persist) |

## 6. Tests & CI

| Kind | Location |
|------|----------|
| Unit Vitest | `identity\|api\|ai\|web` `*.test.ts` |
| E2E Playwright | `e2e/tests/` |
| CI | `.github/workflows/ci.yml` (unit + lint hard-fail) |
| E2E CI | `.github/workflows/e2e.yml` runs all Playwright specs and hard-fails |
| Publish | `docker-publish.yml`, `release.yml` |
| Security scans | trivy, codeql, gitleaks |

## 7. Docs & design assets

- ADRs: `docs/adr/`
- Media: `docs/media/` (README gallery)
- Scout / audits: `docs/reports/`

## 8. Related

- [Architecture](./system-architecture.md)
- [Services detail](./architecture/services.md)
- [Roadmap](./project-roadmap.md)
