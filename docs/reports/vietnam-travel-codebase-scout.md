# Vietnam Travel — Codebase Scout Report

**Repo:** `VN_TravelAI` (GitHub `JasonTM17/VN_TravelAI`)  
**Scout date:** 2026-07-10 (refreshed same day after hardening commits)  
**Mode:** evidence from repository on `main`  
**Product framing:** Vietnam travel marketplace (Traveloka-like UX) + DeepSeek concierge; product name in UI is **TravelAI**  
**Source of truth:** repository files only  

---

## 1. Executive summary

Vietnam Travel (UI brand: **TravelAI**) is a **service-split monorepo** targeting Vietnam (+ world) travel browsing/booking demo with an AI chat path. Stack: four Node 22 TypeScript apps (`web`, `api`, `identity`, `ai`), PostgreSQL (two DBs), Redis, Meilisearch, optional MinIO/n8n, local DeepSeek via HMAC `chat-webhook`.

| Area | Verdict (post-hardening `main`) |
|------|----------------------------------|
| Product fit | Traveloka-like catalog + locale VI/EN + floating chatbot; **not** a Traveloka integration |
| Local demo MVP | **Usable** — compose local 53000–53003, seed, SSR catalog, mock booking, DeepSeek or degrade |
| Security baseline | **Improved** — JWT PEM fail-closed in prod, SEED_DEMO gate, CORS allowlist identity/ai, Meili filter sanitize, dual-JWKS bearer, refresh client, raw HMAC body |
| Production-ready | **Still partial** — tokens still in `localStorage`, mock pay only, Docker install not frozen, e2e not in CI, OpenAPI client may lag YAML, no real inventory/PSP |
| Chatbot DeepSeek | **PARTIAL** — live via webhook + `deepseek-travel-chat.mjs`; **no** RAG, tool-calling to catalog/booking, chat DB, streaming |
| Payment | **MOCK** only |
| Traveloka domains | **OUT_OF_SCOPE** |

**Overall maturity:** hardened local marketplace + AI concierge demo; remaining work is contract/CI/Docker freeze and product decisions (PSP, tool-calling), not greenfield.

---

## 2. Tech stack (evidence-based)

| Layer | Technology | Evidence |
|-------|------------|----------|
| Language | TypeScript, Node ≥22 | `api/package.json` engines; service `tsconfig` |
| Frontend | Next.js **15.5.16**, React 19, Tailwind 4, App Router | `web/package.json`, `web/src/app/` |
| API / Identity / AI | Fastify 5, Zod, jose, ioredis, prom-client | `*/package.json`, `*/src/main.ts` |
| ORM | Prisma 6 | `api/prisma/schema.prisma`, `identity/prisma/schema.prisma` |
| DB | PostgreSQL 16 | `docker-compose.yml` `postgres:16-alpine` |
| Cache / RL | Redis 7 | compose + `ioredis` usage |
| Search | Meilisearch v1.11 | compose + `api/src/lib/meili.ts` |
| Package mgr | **pnpm** (per-service lockfiles, not single root workspace) | `web/pnpm-lock.yaml`, etc. |
| Auth crypto | Ed25519 JWT + JWKS dual slot | `identity/src/lib/keys.ts`, ADR `docs/adr/0006-ed25519-jwt-auth.md` |
| AI LLM | DeepSeek Chat Completions (HTTP), model default `deepseek-v4-flash` | `scripts/lib/deepseek-travel-chat.mjs`, `docker-compose.local.yml` |
| Orchestration intent | n8n HMAC webhooks (ADR-0004) | `docs/adr/0004-ai-via-n8n.md`, `ai/src/lib/n8n.ts` |
| E2E | Playwright | `e2e/tests/*.spec.ts` |
| Unit | Vitest | `*.test.ts` under services |
| Contract | OpenAPI 3.1 | `docs/openapi.yaml` |
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
├── docs/                # ADR, openapi, media, lighthouse budgets
├── plans/               # prior ck plans (some status lag vs code)
├── docker-compose.yml | .local.yml | .prod.yml
└── .github/workflows/   # ci, docker-publish, release, trivy, codeql, gitleaks
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

**Style:** multi-service monorepo (not modular monolith in one process).  
**Dependency direction:** web → backends; ai → identity JWKS + optional api persist; no FE→DB.  
**Tight coupling:** hand-written DTOs in `web/src/lib/api.ts` vs `docs/openapi.yaml` (drift).  
**Keep:** service split, Ed25519+JWKS design, compose overlays, degraded AI path.  
**Refactor:** CORS consistency, contract generation usage, entrypoint fail modes, session storage.  
**Over-engineered for current product:** MinIO in default stack with **no app usage** (grep: no S3 client in app src).

---

## 5. End-to-end request/data flows

### 5.1 Catalog browse (SSR)
1. `web/src/app/[locale]/page.tsx` → `api.listDestinations|Hotels|Tours|Promos`  
2. Browser vs Docker SSR base URL: `web/src/lib/service-url.ts` + env `API_INTERNAL_URL` (compose)  
3. `api/src/routes/catalog.ts` → Prisma and/or Meili  
4. Evidence of resilience: `Promise.allSettled` on home

### 5.2 Search
- UI: `web/src/app/[locale]/search/page.tsx`, `SearchHero`  
- API: `GET /v1/search` Meili multi-index (`catalog.ts`)  
- Flights: mock inventory in DB (`Flight` model + `GET /v1/flights/search`)

### 5.3 Auth (see §6)

### 5.4 Booking (see §7)

### 5.5 Chat (see §8)

---

## 6. Authentication flow

```
register/login → identity POST /v1/auth/* 
  → access JWT (EdDSA) + opaque refresh (hash in DB)
  → web auth-form saves both to localStorage (web/src/lib/auth-storage.ts)
  → subsequent api/ai calls: Authorization Bearer
  → api/ai verify via JWKS (jose)
  → refresh endpoint EXISTS on identity; web has NO client refresh usage (only setItem refresh)
  → change-password: identity route + account UI + e2e
```

| Step | Status | Evidence |
|------|--------|----------|
| Register/login/refresh/logout/me | PARTIAL (API COMPLETE; FE refresh MISSING) | `identity/src/routes/auth.ts`, `web` no `api.refresh` |
| JWT dual JWKS publish | COMPLETE | `/.well-known/jwks.json` |
| Account lockout fields | COMPLETE (schema+login path) | `identity/prisma/schema.prisma`, login lock check |
| Demo admin seed | PARTIAL / prod risk | `identity/src/main.ts` `ensureDemoUser` always |
| Session storage | PARTIAL / weak | `localStorage` access+refresh |

---

## 7. Booking / payment flow

```
BookButton (client)
  → createBooking (Idempotency-Key UUID)
  → payBooking(..., "success")  // auto mock pay same click
  → /bookings list
```

| Capability | Status | Evidence |
|------------|--------|----------|
| Booking model + statuses | PARTIAL | `api/prisma/schema.prisma` `Booking`, `BookingStatus` |
| State machine unit tests | COMPLETE (lib only) | `api/src/lib/booking-state.ts` + `.test.ts` |
| Create + list + pay + cancel routes | PARTIAL | `api/src/routes/bookings.ts` |
| Cancel uses `canTransition` | **BROKEN/incomplete** | cancel sets cancelled without state machine (scout prior; verify in bookings.ts) |
| Idempotency key unique | PARTIAL | schema unique; race may 500 |
| Real payment / PSP / refund | **MISSING** | only mock outcome string |
| Inventory / overselling control | **MISSING** | no seat/room decrement on book |
| Transport bookable | **MISSING** | `BookingItemType` hotel\|tour\|flight only |
| E2E happy path | PARTIAL | `e2e/tests/booking-happy.spec.ts` |

---

## 8. DeepSeek chatbot flow

```
ChatbotWidget / AiPlanner (web, Bearer required for chat)
  → ai POST /v1/chat { message, conversationId? }
  → rate limit redis rl:ai:chat:{userId} 20/min (fail-open)
  → callN8nWebhook path "travel-chat", HMAC body, timeout 55s
  → local compose: N8N_WEBHOOK_BASE_URL=http://chat-webhook:5678/webhook
  → mock-n8n-webhook.mjs verifies HMAC → deepseek-travel-chat.mjs → api.deepseek.com
  → on failure: degradedChatReply (template, degraded:true)
```

| Capability | Status | Evidence |
|------------|--------|----------|
| HTTP client + system prompt | PARTIAL/COMPLETE local | `scripts/lib/deepseek-travel-chat.mjs` |
| Model/base URL env | COMPLETE local | `docker-compose.local.yml` `DEEPSEEK_*` |
| API key | env only (not in report) | compose/example placeholders |
| Streaming | **MISSING** | no SSE in ai chat |
| Conversation DB persistence | **MISSING** | UUID only in response; no messages table |
| RAG / embeddings / vector | **MISSING** | no code |
| Tool/function calling to catalog/booking | **MISSING** | prompt only; no tools |
| Authorization before tools | N/A (no tools) | |
| Degraded fallback | COMPLETE | `ai/src/lib/degraded.ts` |
| Inbound HMAC hook | PARTIAL | `POST /v1/hooks/n8n-callback` re-`JSON.stringify` body |
| Unit tests DeepSeek | PARTIAL | `scripts/lib/deepseek-travel-chat.test.mjs`; hmac tests in ai |
| Prompt injection defense | PARTIAL | system prompt rules only |
| Cost/usage telemetry | **MISSING** | |

n8n workflow JSON exists under `infra/n8n/workflows/` — **import not automated** in compose (manual / local mock preferred).

---

## 9. Docker / container architecture

| Artifact | Role |
|----------|------|
| `docker-compose.yml` | Full stack: postgres, redis, meili, minio, n8n, identity, api, ai, web |
| `docker-compose.local.yml` | Ports **53000–53003**, `chat-webhook` DeepSeek stand-in |
| `docker-compose.prod.yml` | Thin image pull overlay `nguyenson1710/travelai-*` |
| `*/Dockerfile` | Multi-stage, non-root 65532, HEALTHCHECK; ai distroless |
| `api|identity/docker-entrypoint.sh` | migrate (and seed on api) |

**Findings:**
- `pnpm install --no-frozen-lockfile` in Dockerfiles → non-reproducible builds (`web/Dockerfile` L5)
- api entrypoint: `migrate deploy || true` and seed `|| true` → broken schema can still start (`api/docker-entrypoint.sh`)
- web runner copies full `node_modules` + `.next` despite standalone flag when `DOCKER_BUILD=1`
- base compose publishes DB/Redis/Meili/MinIO ports to host → prod risk if used as prod
- MinIO unused by apps
- Redis no auth in compose
- Meili `MEILI_ENV: development` in base compose
- Image publish: Dual Hub+GHCR workflow exists; **GH Actions may fail on account billing**; local GHCR needs `write:packages` token

---

## 10. Database overview

### identity DB (`identity/prisma/schema.prisma`)
- `User` (email unique, role string, lockout fields)
- `RefreshToken` (hash unique, revoke)
- Migrations: `20260709150000_init`, `20260710033000_user_role`

### catalog DB (`api/prisma/schema.prisma`)
- Destination, Hotel, Tour, Flight, Transport, Review  
- Booking (+ status enum, idempotencyKey unique)  
- WishlistItem (unique user+type+id)  
- Itinerary (persisted JSON days)  
- AdminAuditLog, Promo  
- Migrations: init, transport, admin_audit, promos_and_catalog_scale  
- Seed: `api/prisma/seed.ts` (large marketplace)

**Missing:** chat messages table; payment transactions; room inventory; soft delete; FK from booking.userId to identity DB (cross-DB — expected split).

**Risks:** concurrent booking no inventory lock; Meili filter string interpolation (`api/src/routes/catalog.ts`); wishlist N+1 enrichment.

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
| GET | `/healthz` `/readyz` `/metrics` | |

### api
| Method | Path | Notes |
|--------|------|-------|
| GET | `/v1/destinations`, `/:slug` | |
| GET | `/v1/hotels`, `/:slug` | |
| GET | `/v1/tours`, `/:slug` | |
| GET | `/v1/flights/search` | mock |
| GET | `/v1/transports`, `/:slug` | no book |
| GET | `/v1/search` | Meili |
| GET | `/v1/promos` | **not in OpenAPI** |
| GET/POST | `/v1/bookings`, pay, cancel | mock pay |
| GET/POST/DELETE | `/v1/wishlists` | |
| POST/GET | `/v1/itineraries/persist`, `/:id` | |
| POST/GET | `/v1/admin/reindex`, `/v1/admin/audit` | admin JWT |
| GET | `/healthz` `/readyz` `/metrics` | |

### ai
| Method | Path | Notes |
|--------|------|-------|
| POST | `/v1/chat` | JWT + webhook/degrade |
| POST/GET | `/v1/itineraries`, `/:id` | in-memory Map + optional persist |
| POST | `/v1/hooks/n8n-callback` | HMAC |
| GET | `/healthz` `/readyz` `/metrics` | readyz always ready |

OpenAPI (`docs/openapi.yaml`) **incomplete** vs code (promos, admin, persist, hooks, role).

---

## 12. Frontend page inventory

| Route | Status | Data source |
|-------|--------|-------------|
| `/[locale]` home | PARTIAL | live API + promos |
| `/hotels`, `/hotels/[slug]` | PARTIAL | API + gallery |
| `/tours`, `/tours/[slug]` | PARTIAL | API |
| `/destinations/[slug]` | PARTIAL | API |
| `/flights` | MOCK inventory | API mock flights |
| `/transport` | PARTIAL browse-only | API transports |
| `/search`, `/explore` | PARTIAL | API |
| `/login`, `/register`, `/account` | PARTIAL | identity |
| `/bookings` | PARTIAL | API |
| `/wishlist` | PARTIAL | API |
| `/ai` | PARTIAL | ai chat/itinerary |
| `/admin` | PARTIAL | client role gate + API |
| Chatbot widget (global) | PARTIAL | ai chat |
| Locale i18n vi/en | PARTIAL | `web/src/lib/i18n.ts` |
| `not-found` / sitemap | **MISSING** | |

---

## 13–14. Module status matrix

| Module | Status | Notes |
|--------|--------|-------|
| Multi-service compose local | COMPLETE | local overlay + health |
| Catalog CRUD read API | COMPLETE | seed-driven |
| SSR catalog home | COMPLETE | allSettled |
| Meili search | PARTIAL | works; filter injection risk |
| Promos API → home carousel | COMPLETE | |
| Auth API | COMPLETE | |
| Auth FE session | PARTIAL | localStorage; no refresh client |
| Admin reindex/audit | PARTIAL | JWT role; optional token |
| Booking create/list | PARTIAL | |
| Mock payment | MOCK | intentional |
| Real payment | MISSING | |
| Wishlist | PARTIAL | toggle incomplete historically |
| Reviews display | PARTIAL | seed data; no user write API found |
| Transport | PARTIAL | list only |
| DeepSeek chat (local webhook) | PARTIAL | live if key set |
| n8n production workflows | DISCONNECTED | JSON present; auto-import missing |
| AI tool calling / RAG | MISSING | |
| Chat history DB | MISSING | |
| i18n vi/en | PARTIAL | recent pass; residual EN possible |
| OpenAPI fidelity | PARTIAL/BROKEN drift | missing routes |
| CI hard quality gates | PARTIAL | continue-on-error tests/lint |
| E2E in CI | MISSING | local only |
| Prod fail-closed secrets | BROKEN risk | ephemeral JWT allowed |
| Identity/ai CORS | BROKEN prod posture | `origin: true` |
| MinIO | DISCONNECTED | unused |
| Notification/email | MISSING | |
| Partner/vendor multi-tenant | MISSING / OUT_OF_SCOPE | |
| Traveloka integration | OUT_OF_SCOPE | |

---

## 15. Important files by domain

| Domain | Paths |
|--------|-------|
| Auth | `identity/src/routes/auth.ts`, `identity/src/lib/keys.ts`, `tokens.ts`, `web/src/lib/auth-storage.ts`, `web/src/components/auth-form.tsx` |
| Catalog | `api/src/routes/catalog.ts`, `api/prisma/schema.prisma`, `api/prisma/seed.ts`, `api/src/lib/meili.ts` |
| Booking | `api/src/routes/bookings.ts`, `api/src/lib/booking-state.ts`, `web/src/components/book-button.tsx` |
| AI/Chat | `ai/src/main.ts`, `ai/src/lib/n8n.ts`, `degraded.ts`, `scripts/mock-n8n-webhook.mjs`, `scripts/lib/deepseek-travel-chat.mjs` |
| Web shell | `web/src/app/[locale]/layout.tsx`, `navbar.tsx`, `chatbot-widget.tsx`, `lib/i18n.ts`, `lib/api.ts` |
| Docker | `docker-compose*.yml`, `*/Dockerfile`, `api/docker-entrypoint.sh` |
| Contract | `docs/openapi.yaml`, `web/src/generated/openapi.ts` |
| CI | `.github/workflows/ci.yml`, `docker-publish.yml`, `release.yml` |
| ADR | `docs/adr/0001`–`0007` |

---

## 16. Docker findings & container risks

| Finding | Severity | Evidence |
|---------|----------|----------|
| migrate/seed swallow errors | High | `api/docker-entrypoint.sh` |
| Non-frozen lockfile installs | Medium | Dockerfiles |
| Host-published data plane ports | High (if “prod” compose) | `docker-compose.yml` |
| Demo defaults in compose | High | DEMO_USER_*, weak Meili key defaults |
| Unused MinIO attack surface | Low–Med | compose minio service |
| Web image bakes localhost public URLs | High for Hub deploy | `web/Dockerfile` ARG defaults |
| CI docker-publish may not run | High ops | Actions billing (observed session) |
| Healthchecks present | Good | compose + Dockerfiles |

---

## 17. Security findings

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| S1 | Critical | Ephemeral JWT if PEM empty | `identity/src/lib/keys.ts` |
| S2 | Critical | Demo admin always ensured | `identity/src/main.ts` |
| S3 | High | CORS reflect-any on identity & ai | `origin: true` |
| S4 | High | Meili filter string interpolation | `api/src/routes/catalog.ts` |
| S5 | High | JWT+refresh in localStorage | `web/src/lib/auth-storage.ts` |
| S6 | High | CSP connect-src localhost only + unsafe-eval | `web/next.config.ts` |
| S7 | Medium | Identity bearer verify primary-only historically | auth.ts importJWK primary |
| S8 | Medium | Login RL Redis without try/catch may 500 | auth login |
| S9 | Medium | Metrics endpoints public | all services |
| S10 | Medium | Admin reindex token optional | api admin routes |
| S11 | Low–Med | Demo credentials prefilled on login form | `auth-form.tsx` |
| S12 | Medium | Inbound HMAC not raw body | ai n8n-callback |
| S13 | Info | Payment mock — no card data | intentional |

**No secrets printed in this report.** `.env` is gitignored; examples use placeholders.

---

## 18. Performance / reliability

- Catalog list RL 120/min redis fail-open (`api/src/lib/rate-limit.ts`)  
- Chat 55s timeout + degrade — good for DeepSeek latency  
- Home allSettled — good  
- Meili full delete+reindex — search gap during rebuild  
- AI itineraries in-memory Map — lost on restart / multi-replica  
- web `/readyz` may not fail when API down (prior finding)  
- No OTel/trace middleware; only prom counters  

---

## 19. Testing gaps

| Present | Missing |
|---------|---------|
| Vitest: booking-state, rate-limit, keys, tokens, password-policy, hmac, gallery/promo/jwt-role/service-url | Route/integration inject tests |
| Playwright: smoke, gestures, booking-happy, auth change-password | E2E in CI; wishlist; admin; refresh; Meili injection; concurrent book |
| Script tests deepseek helpers | Contract OpenAPI strict CI |
| CI coverage flag | No `@vitest/coverage-v8` provider observed |

---

## 20. Technical debt

1. OpenAPI drift + unused generated client at runtime  
2. Dual copy of types FE/BE  
3. Soft CI gates vs CONTRIBUTING claims  
4. Fake marketing list prices / fixed ratings on home cards  
5. MinIO in stack unused  
6. Plans folder status lag vs cooked features  
7. Missing project docs suite (architecture/deployment under `docs/` incomplete vs AGENTS list)  

---

## 21. Production blockers (ordered)

1. Fail-closed JWT PEMs + disable demo admin in production  
2. CORS allowlist identity/ai  
3. Meili filter sanitization  
4. Web session refresh + CSP for real hosts  
5. Entrypoint migrate hard-fail; seed off by default  
6. Honest CI (tests fail build) + runnable image publish path  
7. Prod compose: no public DB ports; secrets required  
8. Document mock payment; no real money path  

---

## 22. Unresolved questions

1. Production host model: single VPS compose vs managed K8s?  
2. Keep mock payment indefinitely or choose a PSP later?  
3. Is MinIO planned for media soon?  
4. Persist chat transcripts for support/compliance?  
5. Tool-calling into catalog required for v1 product or advisory chat only?  
6. GH Actions billing / GHCR packages operational status for owner account?  

---

## 23. Assumptions to confirm

| # | Assumption | Default if unconfirmed |
|---|------------|------------------------|
| A1 | Product name “Vietnam Travel” = this TravelAI repo | **Yes** (only matching repo) |
| A2 | Mock pay is acceptable through hardening phases | **Yes** until PSP decision |
| A3 | Service split stays (no merge to monolith) | **Yes** (ADR-0002) |
| A4 | AI stays behind n8n/HMAC boundary (ADR-0004) | **Yes** |
| A5 | Transport remains browse-only short term | **Yes** |
| A6 | Sequential cook one phase at a time | **Yes** (user constraint) |

---

## 24. Suggested dependency order for master plan

```
P1 Security fail-closed (identity/api/ai/docker entry)
 → P2 Web auth session + CSP + error envelope
 → P3 Booking lifecycle correctness (no invent PSP)
 → P4 OpenAPI sync + FE generate check
 → P5 DeepSeek path hardening (HMAC raw, no fake RAG)
 → P6 CI honesty + e2e job + coverage provider
 → P7 Docker prod parity + frozen lockfile + seed policy
 → P8 SEO/i18n/a11y + product polish
 → P9 Observability + deployment docs + backup runbook
```

No parallel implementation phases. TDD per phase. Docker verify via `docker compose -f docker-compose.yml -f docker-compose.local.yml`.

---

## Scout constraints compliance

- No source edits, no package installs, no migrations, no image build/push in this scout pass.  
- Status labels used only with file-path evidence or **UNKNOWN**.  
- No secret values included.

**Report path:** `docs/reports/vietnam-travel-codebase-scout.md`
