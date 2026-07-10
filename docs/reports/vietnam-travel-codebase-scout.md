# Vietnam Travel — Codebase Scout Report

**Repo:** `VN_TravelAI` (GitHub `JasonTM17/VN_TravelAI`)  
**Scout date:** 2026-07-10 (refreshed on `main` @ `e653338`)  
**Mode:** evidence from repository files only (read-only scout)  
**Product framing:** Vietnam travel marketplace (Traveloka-like UX) + DeepSeek concierge; UI brand **TravelAI**  
**Source of truth:** repository on `main`  

---

## 1. Executive summary

Vietnam Travel (UI: **TravelAI**) is a **service-split monorepo** for Vietnam (+ world) travel browsing/booking demo with AI chat. Stack: four Node 22 TypeScript apps (`web`, `api`, `identity`, `ai`), PostgreSQL (two DBs), Redis, Meilisearch, optional MinIO/n8n, local DeepSeek via HMAC `chat-webhook`.

| Area | Verdict (post-hardening `main` @ e653338) |
|------|-------------------------------------------|
| Product fit | Traveloka-like catalog + VI/EN + floating chatbot; **not** Traveloka integration |
| Local demo MVP | **Usable** — compose local 53000–53003, seed, SSR catalog, mock booking, DeepSeek or degrade |
| Security baseline | **Hardened** — JWT PEM fail-closed prod (`identity/src/lib/keys.ts`), `SEED_DEMO_USER` gate, CORS allowlist all three backends, Meili sanitize (`api/src/lib/meili-filter.ts`), dual-JWKS, web refresh on 401 (`web/src/lib/api.ts`), raw HMAC body (`ai/src/main.ts`) |
| Production-ready | **Partial** — tokens still `localStorage`; mock pay only; Docker frozen-lockfile; e2e workflow gated by `E2E_ENABLED`; OpenAPI + generated client present; no real inventory/PSP |
| Chatbot DeepSeek | **PARTIAL** — live via webhook + `scripts/lib/deepseek-travel-chat.mjs`; **no** RAG, tool-calling, chat DB, streaming |
| Payment | **MOCK** only |
| Traveloka domains | **OUT_OF_SCOPE** |

**Overall maturity:** production-hardening checklist for local marketplace + AI concierge is **implemented on `main`**. Residual = **ops** (enable E2E when Actions billing allows) + **product** (PSP, cookie session, tool-calling) — not missing core Dockerfile freeze / OpenAPI regen / booking state machine.

---

## 2. Tech stack (evidence-based)

| Layer | Technology | Evidence |
|-------|------------|----------|
| Language | TypeScript, Node ≥22 | `api/package.json` engines; service `tsconfig` |
| Frontend | Next.js **15.5.x**, React 19, Tailwind 4, App Router | `web/package.json`, `web/src/app/` |
| API / Identity / AI | Fastify 5, Zod, jose, ioredis, prom-client | `*/package.json`, `*/src/main.ts` |
| ORM | Prisma 6 | `api/prisma/schema.prisma`, `identity/prisma/schema.prisma` |
| DB | PostgreSQL 16 | `docker-compose.yml` `postgres:16-alpine` |
| Cache / RL | Redis 7 | compose + `ioredis` |
| Search | Meilisearch v1.11 | compose + `api/src/lib/meili.ts` |
| Package mgr | **pnpm** (per-service lockfiles; no root workspace) | `web/pnpm-lock.yaml`, etc. |
| Auth crypto | Ed25519 JWT + JWKS dual slot | `identity/src/lib/keys.ts`, `docs/adr/0006-ed25519-jwt-auth.md` |
| AI LLM | DeepSeek Chat Completions HTTP; default model via env | `scripts/lib/deepseek-travel-chat.mjs`, `docker-compose.local.yml` |
| Orchestration intent | n8n HMAC webhooks (ADR-0004) | `docs/adr/0004-ai-via-n8n.md`, `ai/src/lib/n8n.ts` |
| E2E | Playwright | `e2e/tests/*.spec.ts` |
| Unit | Vitest | `*.test.ts` under services |
| Contract | OpenAPI 3.1 + Redocly | `docs/openapi.yaml`, `redocly.yaml` |
| CI | GitHub Actions | `.github/workflows/*` |

**Not found:** shared npm workspace root, GraphQL, Kafka/queue workers, vector DB, Stripe/real PSP, native mobile apps.

---

## 3. Repository map

```
VN_TravelAI/
├── web/                 # Next.js UI + locale routes
├── api/                 # Catalog, bookings, wishlist, admin reindex
├── identity/            # Auth, JWKS, refresh, lockout
├── ai/                  # Chat + itinerary orchestrator → n8n/webhook
├── e2e/                 # Playwright (local stack)
├── scripts/             # smoke, DeepSeek webhook mock, audits
├── infra/               # postgres init, n8n workflow JSON
├── docs/                # ADR, openapi, media, reports
├── plans/               # local ck plans (often gitignored)
├── docker-compose.yml | .local.yml | .prod.yml
└── .github/workflows/   # ci, docker-publish, release, e2e, trivy, codeql, gitleaks
```

Each of `web|api|identity|ai` has own `Dockerfile`, `package.json`, `pnpm-lock.yaml`, `README.md`.

---

## 4. Architecture & dependency map

```
Browser
  → web (:3000 / local 53000)
       → identity (/v1/auth/*, JWKS)
       → api (/v1/catalog|bookings|wishlists|search|promos|admin)
       → ai (/v1/chat, /v1/itineraries)
  api → postgres (catalog DB), redis, meilisearch, JWKS(identity)
  identity → postgres (identity DB), redis
  ai → redis, JWKS(identity), N8N_WEBHOOK_BASE_URL
       local: chat-webhook → DeepSeek API
       base: n8n container (workflows mounted, not auto-imported)
```

**Style:** multi-service monorepo (not one-process monolith).  
**Dependency direction:** web → backends; ai → identity JWKS + optional api persist; no FE→DB.  
**Tight coupling residual:** hand-written runtime DTOs in `web/src/lib/api.ts` vs generated `web/src/generated/openapi.ts` (client gen exists; runtime still custom).  
**Keep:** service split, Ed25519+JWKS, compose overlays, degraded AI path.  
**Refactor candidates:** cookie BFF session; wire generated OpenAPI client at runtime; drop unused MinIO from default stack.  
**Over-engineered for current product:** MinIO in default compose with **no S3 client in app src**.

---

## 5. End-to-end request/data flows

### 5.1 Catalog browse (SSR)
1. `web/src/app/[locale]/page.tsx` → `api.listDestinations|Hotels|Tours|Promos`  
2. Browser vs Docker SSR: `web/src/lib/service-url.ts` + `API_INTERNAL_URL`  
3. `api/src/routes/catalog.ts` → Prisma and/or Meili  
4. Resilience: `Promise.allSettled` on home

### 5.2 Search
- UI: `web/src/app/[locale]/search/page.tsx`, `SearchHero`  
- API: `GET /v1/search` Meili multi-index (`catalog.ts`); filters via `meili-filter.ts`  
- Flights: seed inventory (`Flight` model + `GET /v1/flights/search`)

### 5.3 Auth (see §6)

### 5.4 Booking (see §7)

### 5.5 Chat (see §8)

---

## 6. Authentication flow

```
register/login → identity POST /v1/auth/*
  → access JWT (EdDSA) + opaque refresh (hash in DB)
  → web auth-form → saveSession(access, refresh) localStorage
  → api/ai: Authorization Bearer; verify JWKS
  → on 401 with Bearer: web refreshAccessToken() → POST /v1/auth/refresh → retry once
  → change-password: identity + account UI + e2e
```

| Step | Status | Evidence |
|------|--------|----------|
| Register/login/refresh/logout/me | COMPLETE (API + FE refresh) | `identity/src/routes/auth.ts`, `web/src/lib/api.ts` `refreshAccessToken` |
| JWT dual JWKS publish | COMPLETE | `/.well-known/jwks.json`, `keys.ts` |
| Account lockout | COMPLETE | schema + login path `identity/prisma/schema.prisma` |
| Demo admin seed | COMPLETE (gated) | `SEED_DEMO_USER` in `identity/src/main.ts` + config |
| Session storage | PARTIAL / weak | `localStorage` still XSS-sensitive; cookie BFF deferred |
| Prod JWT PEM | COMPLETE fail-closed | `loadKeySlots` throws if prod/requirePem and empty PEM |

---

## 7. Booking / payment flow

```
BookButton (client)
  → createBooking (Idempotency-Key UUID)
  → optional pay only if NEXT_PUBLIC_BOOK_AUTOPAY=true (default: create only)
  → /bookings list
BookingsClient
  → payBooking(..., "success"|"fail") mock two-step
  → cancel → API canTransition(from, "cancelled")
```

| Capability | Status | Evidence |
|------------|--------|----------|
| Booking model + statuses | COMPLETE (enum lifecycle) | `api/prisma/schema.prisma` `Booking`, status string/enum usage |
| State machine unit tests | COMPLETE | `api/src/lib/booking-state.ts` + `.test.ts` |
| Create + list + pay + cancel | COMPLETE (mock pay) | `api/src/routes/bookings.ts` |
| Cancel uses `canTransition` | COMPLETE | `bookings.ts` cancel path |
| Two-step mock pay (no auto-pay default) | COMPLETE | `web/src/components/book-button.tsx` `NEXT_PUBLIC_BOOK_AUTOPAY` |
| Idempotency key unique | PARTIAL | schema unique; race may still surface as 500 |
| Real payment / PSP / refund | **MISSING** | mock outcome only |
| Inventory / overselling control | **MISSING** | no seat/room decrement on book |
| Transport bookable | **MISSING** | `BookingItemType` hotel\|tour\|flight only |
| E2E happy path | PARTIAL | `e2e/tests/booking-happy.spec.ts` (local; CI gated) |

---

## 8. DeepSeek chatbot flow

```
ChatbotWidget / AiPlanner (web, Bearer required)
  → ai POST /v1/chat { message, conversationId? }
  → rate limit redis rl:ai:chat:{userId} 20/min (fail-open)
  → callN8nWebhook "travel-chat", HMAC body, timeout 55s
  → local: N8N_WEBHOOK_BASE_URL → chat-webhook → deepseek-travel-chat.mjs → api.deepseek.com
  → on failure: degradedChatReply (degraded:true)
```

| Capability | Status | Evidence |
|------------|--------|----------|
| HTTP client + system prompt | COMPLETE (local path) | `scripts/lib/deepseek-travel-chat.mjs` |
| Model/base URL env | COMPLETE local | compose `DEEPSEEK_*` |
| API key | env only (not in report) | placeholders in examples |
| Streaming | **MISSING** | no SSE |
| Conversation DB persistence | **MISSING** | UUID only; no messages table |
| RAG / embeddings / vector | **MISSING** | no code |
| Tool/function calling | **MISSING** | prompt only |
| Degraded fallback | COMPLETE | `ai/src/lib/degraded.ts` |
| Inbound HMAC hook | COMPLETE (raw body) | `ai/src/main.ts` rawBody + `hmac-guard.ts` |
| Unit tests DeepSeek/HMAC | PARTIAL | `scripts/lib/deepseek-travel-chat.test.mjs`; `ai/src/lib/hmac.test.ts` |
| Prompt injection defense | PARTIAL | system prompt rules only |
| Cost/usage telemetry | **MISSING** | |

n8n workflow JSON under `infra/n8n/workflows/` — **import not automated** (DISCONNECTED from default local path which uses chat-webhook).

---

## 9. Docker / container architecture

| Artifact | Role |
|----------|------|
| `docker-compose.yml` | Full stack: postgres, redis, meili, minio, n8n, identity, api, ai, web |
| `docker-compose.local.yml` | Ports **53000–53003**, `chat-webhook` DeepSeek stand-in |
| `docker-compose.prod.yml` | Image pull overlay + data-plane lockdown |
| `*/Dockerfile` | Multi-stage, non-root 65532, HEALTHCHECK; **frozen-lockfile** |
| `api|identity/docker-entrypoint.sh` | migrate hard-fail; api seed if `RUN_SEED=true` |

**Findings (current):**
- Dockerfiles: `pnpm install --frozen-lockfile` (web/api/identity/ai)
- Entrypoints: hard-fail `migrate deploy`; seed gated (`api/docker-entrypoint.sh`)
- web: `DOCKER_BUILD=1` enables Next standalone (`web/next.config.ts`)
- base compose still publishes DB/Redis/Meili ports (local OK); prod overlay restricts
- MinIO unused in app code; residual surface
- Image publish: Hub + GHCR workflows; Actions may be billing-limited (**ops**)

---

## 10. Database overview

### identity DB (`identity/prisma/schema.prisma`)
- `User` (email unique, role, lockout fields)
- `RefreshToken` (hash unique, revoke)
- Migrations: init + user_role

### catalog DB (`api/prisma/schema.prisma`)
- Destination, Hotel, Tour, Flight, Transport, Review  
- Booking (+ status, idempotencyKey unique)  
- WishlistItem, Itinerary, AdminAuditLog, Promo  
- Seed: `api/prisma/seed.ts`

**Missing:** chat messages; payment transactions; room inventory decrement; soft delete; FK booking.userId → identity (cross-DB by design).

**Risks:** concurrent booking without inventory lock (**MISSING** control); Meili filters sanitized (**low** residual); wishlist enrichment N+1 possible.

---

## 11. API inventory (implemented)

### identity
| Method | Path | Notes |
|--------|------|-------|
| POST | `/v1/auth/register` | Zod |
| POST | `/v1/auth/login` | lockout + RL |
| POST | `/v1/auth/refresh` | rotate |
| POST | `/v1/auth/logout` | body refresh |
| GET | `/v1/auth/me` | Bearer |
| POST | `/v1/auth/change-password` | revokes refresh |
| GET | `/.well-known/jwks.json` | dual keys |
| GET | `/healthz` `/readyz` `/metrics` | + request-id header |

### api
| Method | Path | Notes |
|--------|------|-------|
| GET | `/v1/destinations`, `/:slug` | |
| GET | `/v1/hotels`, `/:slug` | |
| GET | `/v1/tours`, `/:slug` | |
| GET | `/v1/flights/search` | seed/mock inventory |
| GET | `/v1/transports`, `/:slug` | browse only |
| GET | `/v1/search` | Meili + sanitize |
| GET | `/v1/promos` | OpenAPI + client |
| GET/POST | `/v1/bookings`, pay, cancel | mock pay; cancel state machine |
| GET/POST/DELETE | `/v1/wishlists` | |
| POST/GET | `/v1/itineraries/persist`, `/:id` | |
| POST/GET | `/v1/admin/reindex`, `/v1/admin/audit` | admin JWT |
| GET | `/healthz` `/readyz` `/metrics` | + request-id |

### ai
| Method | Path | Notes |
|--------|------|-------|
| POST | `/v1/chat` | JWT + webhook/degrade |
| POST/GET | `/v1/itineraries`, `/:id` | in-memory Map + optional persist |
| POST | `/v1/hooks/n8n-callback` | HMAC raw body |
| GET | `/healthz` `/readyz` `/metrics` | readyz redis status fail-open |

OpenAPI (`docs/openapi.yaml`) includes promos/admin/persist/hooks/role; client regenerated (`web/src/generated/openapi.ts`). Runtime FE still uses hand-written `web/src/lib/api.ts`.

---

## 12. Frontend page inventory

| Route | Status | Data source |
|-------|--------|-------------|
| `/[locale]` home | COMPLETE (demo depth) | live API + promos |
| `/hotels`, `/hotels/[slug]` | COMPLETE (demo) | API + gallery; `generateMetadata` |
| `/tours`, `/tours/[slug]` | COMPLETE (demo) | API + meta |
| `/destinations/[slug]` | COMPLETE (demo) | API + meta |
| `/flights` | MOCK inventory | API flights |
| `/transport` | PARTIAL browse-only | API transports; no book |
| `/search`, `/explore` | COMPLETE (demo) | API + meta |
| `/login`, `/register`, `/account` | COMPLETE (demo) | identity + refresh |
| `/bookings` | COMPLETE (mock pay UX) | API two-step pay/cancel |
| `/wishlist` | COMPLETE (demo) | API |
| `/ai` | PARTIAL | chat/itinerary; no history DB |
| `/admin` | PARTIAL | client role gate + API |
| Chatbot widget | PARTIAL | ai chat |
| Locale i18n vi/en | COMPLETE (core strings) | `web/src/lib/i18n.ts` |
| `not-found` / sitemap / robots | COMPLETE | `web/src/app/[locale]/not-found.tsx`, `sitemap.ts`, `robots.ts` |
| CSP | PARTIAL | `next.config.ts` connect-src env + still unsafe-eval for Next |

---

## 13–14. Module status matrix

| Module | Status | Notes |
|--------|--------|-------|
| Multi-service compose local | COMPLETE | local overlay + health |
| Catalog read API + seed | COMPLETE | |
| SSR catalog home | COMPLETE | allSettled |
| Meili search | COMPLETE (filters sanitized) | residual: reindex gap during rebuild |
| Promos API → home | COMPLETE | |
| Auth API | COMPLETE | |
| Auth FE session | PARTIAL | refresh COMPLETE; localStorage residual risk |
| Admin reindex/audit | PARTIAL | JWT role; optional token paths |
| Booking create/list/cancel | COMPLETE (demo) | canTransition |
| Mock payment | MOCK | intentional |
| Real payment | MISSING | product decision |
| Wishlist | COMPLETE (demo) | |
| Reviews display | PARTIAL | seed; no user write API found |
| Transport | PARTIAL | list only |
| DeepSeek chat (local webhook) | PARTIAL | live if key set |
| n8n production workflows | DISCONNECTED | JSON present; auto-import missing |
| AI tool calling / RAG | MISSING | by design / product |
| Chat history DB | MISSING | |
| i18n vi/en | COMPLETE (core) | residual EN polish possible |
| OpenAPI fidelity | COMPLETE (lint+regen) | runtime still custom client |
| CI unit/build gates | COMPLETE | tests hard-fail; lint still `continue-on-error` |
| E2E in CI | PARTIAL | `e2e.yml` gated by `E2E_ENABLED` |
| Prod fail-closed secrets | COMPLETE | keys.ts + SEED gate |
| Identity/ai CORS | COMPLETE | allowlist like api |
| MinIO | DISCONNECTED | unused |
| Notification/email | MISSING | |
| Partner/vendor multi-tenant | OUT_OF_SCOPE | |
| Traveloka integration | OUT_OF_SCOPE | |

---

## 15. Important files by domain

| Domain | Paths |
|--------|-------|
| Auth | `identity/src/routes/auth.ts`, `identity/src/lib/keys.ts`, `tokens.ts`, `web/src/lib/auth-storage.ts`, `web/src/lib/api.ts`, `web/src/components/auth-form.tsx` |
| Catalog | `api/src/routes/catalog.ts`, `api/src/lib/meili-filter.ts`, `api/prisma/schema.prisma`, `api/prisma/seed.ts` |
| Booking | `api/src/routes/bookings.ts`, `api/src/lib/booking-state.ts`, `web/src/components/book-button.tsx`, `web/src/components/bookings-client.tsx` |
| AI/Chat | `ai/src/main.ts`, `ai/src/lib/n8n.ts`, `hmac.ts`, `degraded.ts`, `scripts/mock-n8n-webhook.mjs`, `scripts/lib/deepseek-travel-chat.mjs` |
| Web shell | `web/src/app/[locale]/layout.tsx`, chatbot, `lib/i18n.ts`, `next.config.ts` |
| Docker | `docker-compose*.yml`, `*/Dockerfile`, `api/docker-entrypoint.sh` |
| Contract | `docs/openapi.yaml`, `web/src/generated/openapi.ts`, `redocly.yaml` |
| CI | `.github/workflows/ci.yml`, `e2e.yml`, `docker-publish.yml`, `release.yml` |
| ADR | `docs/adr/0001`–`0007` |

---

## 16. Docker findings & container risks

| Finding | Severity | Status | Evidence |
|---------|----------|--------|----------|
| migrate hard-fail; seed gated | — | **Remediated** | `api/docker-entrypoint.sh` |
| frozen-lockfile installs | — | **Remediated** | all four Dockerfiles |
| Host-published data plane ports | High if “prod” base compose | **Mitigated by prod overlay** | `docker-compose.yml` vs `.prod.yml` |
| Demo defaults in compose | Medium | residual | local DEMO/SEED flags |
| Unused MinIO attack surface | Low–Med | open | compose minio |
| Web public URL ARGs | Medium | residual | build-args must match deploy host |
| CI docker-publish / billing | High ops | open | Actions account |
| Healthchecks | Good | present | Dockerfiles + compose |

---

## 17. Security findings

| ID | Severity | Finding | Status | Evidence |
|----|----------|---------|--------|----------|
| S1 | Critical | Ephemeral JWT if PEM empty in prod | **Remediated** | `keys.ts` requirePem / production |
| S2 | Critical | Demo admin always | **Remediated** | `SEED_DEMO_USER` gate |
| S3 | High | CORS reflect-any identity/ai | **Remediated** | `CORS_ORIGINS` allowlist |
| S4 | High | Meili filter injection | **Remediated** | `meili-filter.ts` + tests |
| S5 | High | JWT+refresh in localStorage | **Open (product)** | `auth-storage.ts` |
| S6 | Medium | CSP still has unsafe-eval | residual Next | `next.config.ts` |
| S7 | Medium | Dual JWKS verify | **Remediated** | JWKS both keys |
| S8 | Medium | Login RL fail-open | intentional residual | redis down |
| S9 | Medium | Metrics public | residual | `/metrics` |
| S10 | Medium | Admin reindex token optional paths | residual | admin routes |
| S11 | Low | Demo credentials prefilled login (local UX) | residual | `auth-form.tsx` |
| S12 | High | Inbound HMAC re-serialize | **Remediated** | rawBody in `ai/src/main.ts` |
| S13 | Info | Payment mock — no card data | intentional | |

**No secrets printed in this report.** `.env` gitignored; examples use placeholders.

---

## 18. Performance / reliability

- Catalog list RL 120/min redis fail-open (`api/src/lib/rate-limit.ts`)  
- Chat 55s timeout + degrade  
- Home allSettled  
- Meili full delete+reindex — search gap during rebuild  
- AI itineraries in-memory Map — lost on restart / multi-replica  
- request-id on identity/api/ai  
- No OTel/trace middleware; prom counters only  

---

## 19. Testing gaps

| Present | Missing / residual |
|---------|-------------------|
| Vitest: booking-state, rate-limit, keys, tokens, hmac, meili-filter, auth-storage, etc. | Full route inject integration suite |
| Playwright: smoke, booking-happy, auth change-password | Always-on CI e2e (needs `E2E_ENABLED` + billing) |
| OpenAPI Redocly lint in CI | Strict security-defined still warn in `redocly.yaml` |
| Unit hard-fail in CI | lint still advisory `continue-on-error` |
| Script deepseek helper tests | Concurrency / overselling tests (N/A until inventory) |

---

## 20. Technical debt

1. Runtime FE client not driven by generated OpenAPI types  
2. Dual DTO shapes FE/BE residual  
3. Lint still soft in CI  
4. Fake marketing list prices / fixed ratings possible on cards  
5. MinIO in stack unused  
6. Chat/itinerary persistence incomplete for multi-replica  
7. Plans dir often gitignored — status local-only  

---

## 21. Production blockers (ordered)

### Closed by hardening (commits through e653338)

1. ~~Fail-closed JWT PEMs + SEED_DEMO gate~~  
2. ~~CORS allowlist identity/ai~~  
3. ~~Meili filter sanitization~~  
4. ~~Web refresh + CSP connect-src env~~  
5. ~~Entrypoint migrate hard-fail; seed flags~~  
6. ~~CI unit tests hard-fail; OpenAPI lint + redocly.yaml~~  
7. ~~Docker frozen-lockfile; prod overlay~~  
8. ~~OpenAPI paths + generated client~~  
9. ~~Booking two-step mock pay + cancel canTransition~~  
10. ~~raw HMAC body; request-id; SEO not-found/sitemap/robots~~  

### Still open (ops / product)

1. **Ops:** set `E2E_ENABLED=true` when Actions billing allows  
2. **Ops:** rebuild/publish images after latest commits if registry lag  
3. **Product:** real payment / inventory  
4. **Product:** session beyond localStorage (cookie BFF)  
5. **Product:** DeepSeek tool-calling into catalog/booking  

---

## 22. Unresolved questions

1. Production host model: single VPS compose vs managed K8s?  
2. Keep mock payment indefinitely or choose a PSP later?  
3. Is MinIO planned for media soon?  
4. Persist chat transcripts for support/compliance?  
5. Tool-calling required for v1 or advisory chat only?  
6. GH Actions billing / GHCR package visibility for owner account?  

---

## 23. Assumptions to confirm

| # | Assumption | Default if unconfirmed |
|---|------------|------------------------|
| A1 | Product name “Vietnam Travel” = this TravelAI repo | **Yes** |
| A2 | Mock pay acceptable until PSP decision | **Yes** |
| A3 | Service split stays | **Yes** (ADR-0002) |
| A4 | AI stays behind n8n/HMAC boundary | **Yes** (ADR-0004) |
| A5 | Transport remains browse-only short term | **Yes** |
| A6 | Master hardening plan technical checklist done on main | **Yes** @ e653338 |

---

## 24. Suggested dependency order (residual only)

Technical master plan phases 1–9 are **done on `main`**. If a new plan is opened, order residuals:

```
R1 Ops: enable E2E_ENABLED + confirm image publish
 → R2 Product decision: cookie session vs accept localStorage residual
 → R3 Product decision: PSP + inventory (only after payment choice)
 → R4 Optional: tool-calling chat (authz + no invent Traveloka)
 → R5 Optional: drop MinIO / wire generated OpenAPI client / OTel
```

No parallel implementation. Do **not** invent Traveloka APIs, real PSP, or RAG without product decision.

---

## Scout constraints compliance

- Scout pass: analysis + this report only (no package install, migration, image build/push for scout).  
- Status labels with file-path evidence or **UNKNOWN**.  
- No secret values included.

**Report path:** `docs/reports/vietnam-travel-codebase-scout.md`  
**HEAD evidence:** `e653338`
