# Project roadmap — residual

**Purpose:** Trạng thái sau product residual + ops close-out.  
**Last verified:** `9f4d424` on `main` (MVP product path complete; ops/PSP residuals remain).

## 1. Engineering baseline (hardening) — DONE

- JWT PEM fail-closed + SEED_DEMO gate  
- CORS allowlist · Meili sanitize · client refresh → **httpOnly cookie**  
- Booking state machine + two-step mock pay + PaymentAttempt  
- OpenAPI + Docker frozen + SEO · request-id  
- Docs suite professionalize  

## 2. Product residual batch — DONE

| Item | Status | Notes |
|------|--------|-------|
| Cookie httpOnly refresh | COMPLETE | + optional `COOKIE_DOMAIN` / `COOKIE_SAMESITE` |
| Mock PaymentAttempt ledger | COMPLETE | |
| Seat inventory flight/transport | COMPLETE | |
| Transport bookable | COMPLETE | |
| Chat history DB | COMPLETE | |
| DeepSeek tool-calling (read-only) | COMPLETE | |
| MinIO media platform | SKIP / DISCONNECTED | |

## 3. Ops residual — status

| Item | Status | Notes |
|------|--------|-------|
| CI unit/build hard-fail | COMPLETE | already |
| CI lint hard-fail | COMPLETE | removed `continue-on-error` on lint |
| `E2E_ENABLED` repo variable | PARTIAL | set via `gh` when permitted; workflow still gated |
| Image Hub/GHCR rebuild | PARTIAL | trigger `docker-publish` when secrets/billing OK |
| Real PSP | NOT IMPLEMENTED | product decision required |
| User reviews write | COMPLETE path | POST /v1/reviews + FE form |
| Hotel soft rooms inventory | COMPLETE path | roomsLeft + per-night calendar |
| Email/notification | COMPLETE path | nodemailer SMTP / HTTP gateway / log |
| Chat SSE streaming | COMPLETE path | POST /v1/chat/stream |
| RAG (Meili + vectors) | COMPLETE path | catalog-rag + Pinecone/Postgres embeddings |
| Read-only tool-calling | COMPLETE path | deepseek-tools |
| Full hotel night calendar | COMPLETE path | HotelNightInventory |
| PMS room types + rate plans | COMPLETE path | HotelRoomType / RatePlan + FE selectors |
| Admin vector reindex | COMPLETE path | POST /v1/admin/reindex-vectors |
| Real PSP | NOT IMPLEMENTED | product decision |

## 4. Explicit non-goals

Traveloka partner APIs · native apps · GDS · multi-vendor PMS · premature K8s · full MinIO CMS · inventing PSP without choice.

## 5. Related

- [PDR](./project-overview-pdr.md)
- [Security overview](./security/overview.md)
- [Deployment](./deployment-guide.md)
