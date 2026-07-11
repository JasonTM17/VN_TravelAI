# Project overview & PDR — TravelAI

**Purpose:** Mô tả sản phẩm, phạm vi, và yêu cầu phát triển dựa trên repository thực tế.  
**Product name (UI):** TravelAI  
**Repo:** `JasonTM17/VN_TravelAI`  
**Last verified:** `a796b94` (2026-07-11)

## 1. Tóm tắt sản phẩm

TravelAI là **marketplace du lịch web** (UX kiểu Traveloka) tập trung catalog Việt Nam & thế giới (seed), kèm **AI concierge** (DeepSeek qua webhook HMAC + catalog RAG). Đây **không** phải tích hợp API Traveloka.

| Khía cạnh | Trạng thái |
|-----------|------------|
| Browse catalog (hotel/tour/destination/flight/transport) | COMPLETE (seed demo) |
| Search Meilisearch | COMPLETE |
| Vector / embedding search (local or Pinecone) | COMPLETE path (optional keys) |
| Auth Ed25519 JWT + dual JWKS + httpOnly refresh cookie | COMPLETE |
| Booking lifecycle + hotel PMS (room type / rate plan) | COMPLETE demo + **MOCK** payment |
| Night inventory + seats inventory | COMPLETE path |
| Email notifications (SMTP / HTTP / log) | COMPLETE path |
| Global chatbot + AI planner (DeepSeek + RAG + tools + SSE) | COMPLETE path (live khi có key; else degraded) |
| Admin Meili reindex + vector reindex + audit | COMPLETE |
| Responsive mobile web | COMPLETE (demo UX) |
| Docker multi-service + registries | COMPLETE; 4 private GHCR packages verified; cloud target = UNKNOWN |

## 2. Mục tiêu sản phẩm (PDR)

### In scope (có bằng chứng code)

1. SSR catalog + locale `vi` / `en` (`web/src/app/[locale]/`)
2. Identity service: register/login/refresh/logout/me/change-password (httpOnly refresh cookie)
3. API catalog, search, vectors, wishlist, bookings (mock pay), reviews, notifications, promos, admin reindex
4. Hotel PMS: room types, rate plans, night inventory, optional `roomTypeId`/`ratePlanId` on book
5. AI service: chat + SSE stream + itinerary → n8n/`chat-webhook` → DeepSeek; Meili + vector RAG; read-only tools
6. Compose local (ports 53000–53003) và prod overlay
7. OpenAPI contract + CI unit/build + image publish workflows

### Out of scope / Non-goals

- Real PSP / card settlement
- Live airline GDS / multi-vendor enterprise PMS
- Native mobile apps
- Traveloka partner APIs
- Kubernetes (không có manifest trong repo)
- Full multi-tenant hotel CMS / channel manager

## 3. Actors

| Actor | Nhu cầu | Surface |
|-------|---------|---------|
| Traveler (guest) | Browse, search | web public routes |
| Traveler (auth) | Wishlist, book, chat, account, reviews | JWT Bearer + cookie refresh |
| Admin demo | Reindex Meili/vectors, audit | `/[locale]/admin` + API admin |
| Operator | Compose, backup, reindex, SMTP/Pinecone keys | docs/operations |

## 4. Functional requirements (verified)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-01 | Catalog destinations/hotels/tours | COMPLETE | `api/src/routes/catalog.ts`, seed |
| FR-02 | Unified search | COMPLETE | `GET /v1/search`, Meili |
| FR-03 | Auth + lockout + dual JWKS + httpOnly refresh | COMPLETE | `identity/` |
| FR-04 | Booking create/list/pay/cancel, atomic transitions + idempotent retries | COMPLETE + MOCK pay | `api/src/routes/bookings.ts` |
| FR-04b | Hotel room type + rate plan + night inventory | COMPLETE demo | `HotelRoomType`, `RatePlan`, `hotel-night-inventory` |
| FR-05 | Chat + SSE + degraded fallback | COMPLETE path | `ai/src/main.ts`, `/v1/chat/stream` |
| FR-05b | Catalog RAG (Meili + vectors) | COMPLETE path | `ai/src/lib/catalog-rag.ts`, `api` vector-store |
| FR-05c | Read-only tool-calling | COMPLETE path | `scripts/lib/deepseek-tools.mjs` |
| FR-06 | Itinerary generate/persist | COMPLETE path | ai + api itineraries |
| FR-07 | Admin Meili + vector reindex + audit | COMPLETE | `POST /v1/admin/reindex`, `…/reindex-vectors` |
| FR-08 | i18n VI/EN | COMPLETE core | `web/src/lib/i18n.ts` |
| FR-09 | Promos carousel | COMPLETE | `GET /v1/promos` |
| FR-10 | Booking email notification | COMPLETE path | `api/src/lib/mailer.ts`, `notify.ts` |

## 5. Non-functional

| Area | Requirement | Status |
|------|-------------|--------|
| Security | Fail-closed JWT PEM prod; CORS allowlist; Meili sanitize; raw HMAC; httpOnly refresh | COMPLETE baseline |
| Observability | healthz/readyz/metrics + x-request-id | PARTIAL (no full OTel) |
| Containers | multi-stage, non-root, frozen-lockfile | COMPLETE |
| Tests | Vitest/lint/build/OpenAPI + Playwright hard-fail; Trivy/CodeQL/Gitleaks gate publish | COMPLETE baseline |
| Performance budgets | `docs/lighthouse-budgets.md` | PARTIAL enforcement |

## 6. Success metrics (engineering)

- Local compose smoke xanh (`scripts/smoke.ps1`)
- Unit tests per service pass
- OpenAPI lint (Redocly) valid
- Docs status tables match code (this file + root README)

## 7. Explicit residuals (not product gaps)

| Item | Status |
|------|--------|
| Real PSP | NOT IMPLEMENTED (product decision) |
| Cloud production host | UNKNOWN |
| GHCR publish | COMPLETE; private `web/api/identity/ai`, tags `latest` + SHA |
| OTel / central logs | NOT IMPLEMENTED in-repo |
