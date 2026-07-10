# Project overview & PDR — TravelAI

**Purpose:** Mô tả sản phẩm, phạm vi, và yêu cầu phát triển dựa trên repository thực tế.  
**Product name (UI):** TravelAI  
**Repo:** `JasonTM17/VN_TravelAI`  
**Last verified:** `e715b96`

## 1. Tóm tắt sản phẩm

TravelAI là **marketplace du lịch web** (UX kiểu Traveloka) tập trung catalog Việt Nam & thế giới (seed), kèm **AI concierge** (DeepSeek qua webhook HMAC). Đây **không** phải tích hợp API Traveloka.

| Khía cạnh | Trạng thái |
|-----------|------------|
| Browse catalog (hotel/tour/destination/flight/transport) | COMPLETE (seed demo) |
| Search Meilisearch | COMPLETE |
| Auth Ed25519 JWT + refresh | COMPLETE (session web: localStorage — PARTIAL security posture) |
| Booking lifecycle | COMPLETE demo + **MOCK** payment |
| Global chatbot + AI planner | PARTIAL (live DeepSeek nếu key; no RAG/tool-calling) |
| Admin reindex | PARTIAL (JWT role + optional admin token) |
| Responsive mobile web | COMPLETE (demo UX) |
| Docker multi-service + registries | COMPLETE tooling; deploy target production = UNKNOWN |

## 2. Mục tiêu sản phẩm (PDR)

### In scope (có bằng chứng code)

1. SSR catalog + locale `vi` / `en` (`web/src/app/[locale]/`)
2. Identity service: register/login/refresh/logout/me/change-password
3. API catalog, search, wishlist, bookings (mock pay), promos, admin reindex
4. AI service: chat + itinerary orchestration → n8n hoặc `chat-webhook` → DeepSeek
5. Compose local (ports 53000–53003) và prod overlay
6. OpenAPI contract + CI unit/build + image publish workflows

### Out of scope / Non-goals

- Real PSP / card settlement
- Live airline GDS / multi-vendor PMS
- Native mobile apps
- Traveloka partner APIs
- RAG / vector DB / tool-calling catalog (chưa implement)
- Kubernetes (không có manifest trong repo)

## 3. Actors

| Actor | Nhu cầu | Surface |
|-------|---------|---------|
| Traveler (guest) | Browse, search | web public routes |
| Traveler (auth) | Wishlist, book, chat, account | JWT Bearer |
| Admin demo | Reindex Meili, audit | `/[locale]/admin` + API admin |
| Operator | Compose, backup, reindex | docs/operations |

## 4. Functional requirements (verified)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-01 | Catalog destinations/hotels/tours | COMPLETE | `api/src/routes/catalog.ts`, seed |
| FR-02 | Unified search | COMPLETE | `GET /v1/search`, Meili |
| FR-03 | Auth + lockout + dual JWKS | COMPLETE | `identity/` |
| FR-04 | Booking create/list/pay/cancel | COMPLETE + MOCK pay | `api/src/routes/bookings.ts` |
| FR-05 | Chat + degraded fallback | PARTIAL | `ai/src/main.ts`, `degraded.ts` |
| FR-06 | Itinerary generate/persist | PARTIAL | ai Map + api persist |
| FR-07 | Admin reindex | PARTIAL | `POST /v1/admin/reindex` |
| FR-08 | i18n VI/EN | COMPLETE core | `web/src/lib/i18n.ts` |
| FR-09 | Promos carousel | COMPLETE | `GET /v1/promos` |

## 5. Non-functional

| Area | Requirement | Status |
|------|-------------|--------|
| Security | Fail-closed JWT PEM prod; CORS allowlist; Meili sanitize; raw HMAC | COMPLETE baseline |
| Observability | healthz/readyz/metrics + x-request-id | PARTIAL (no full OTel) |
| Containers | multi-stage, non-root, frozen-lockfile | COMPLETE |
| Tests | Vitest unit hard-fail CI; Playwright local; e2e CI gated | PARTIAL |
| Performance budgets | `docs/lighthouse-budgets.md` | PARTIAL enforcement |

## 6. Success metrics (engineering)

- Local compose smoke xanh (`scripts/smoke.ps1`)
- Unit tests per service pass
- OpenAPI lint (Redocly) valid
- Demo path: login → browse → book (mock) → chat (degrade ok)

## 7. Related

- [Codebase summary](./codebase-summary.md)
- [Scout report](./reports/vietnam-travel-codebase-scout.md)
- [Roadmap residual](./project-roadmap.md)
