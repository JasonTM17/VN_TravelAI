# Project roadmap — residual

**Purpose:** Trạng thái sau product residual cook trên `main`.  
**Last verified:** commits through tool-calling + chat history (2026-07-10).

## 1. Engineering baseline (hardening) — DONE

- JWT PEM fail-closed + SEED_DEMO gate  
- CORS allowlist · Meili sanitize · client refresh  
- Booking state machine + two-step mock pay  
- OpenAPI + Docker frozen + SEO surfaces · request-id  
- Docs suite professionalize  

## 2. Product residual batch — DONE

| Item | Status | Notes |
|------|--------|-------|
| Cookie httpOnly refresh | COMPLETE | `identity` Set-Cookie; web sessionStorage access |
| Mock PaymentAttempt ledger | COMPLETE | `payment_attempts` table |
| Seat inventory flight/transport | COMPLETE | decrement on pay; restore on cancel confirmed |
| Transport bookable | COMPLETE | `BookingItemType.transport` + BookButton |
| Chat history DB | COMPLETE | `chat_conversations` / `chat_messages` + web persist |
| DeepSeek tool-calling (read-only) | COMPLETE | search/get tools; no book/admin |
| MinIO media platform | SKIP / DISCONNECTED | App still unused |

## 3. Still open — Ops / product later

| Item | Status | Owner |
|------|--------|-------|
| `E2E_ENABLED=true` on Actions | PARTIAL | Repo settings + billing |
| Lint CI hard-fail | PARTIAL | Flip after clean baseline |
| Image Hub/GHCR rebuild after latest | Ops | Publish workflow |
| Real PSP (SePay/Stripe/…) | NOT IMPLEMENTED | Product decision |
| Cookie Domain for multi-subdomain prod | PARTIAL | Configure when hostnames known |
| RAG / vector / streaming SSE | NOT IMPLEMENTED | Explicit non-goal short term |
| Hotel room calendar inventory | NOT IMPLEMENTED | YAGNI |

## 4. Explicit non-goals (giữ)

Traveloka partner APIs · native apps · GDS · multi-vendor PMS · premature K8s · full MinIO CMS.

## 5. Related

- [PDR](./project-overview-pdr.md)
- [Security overview](./security/overview.md)
- Scout: [reports/vietnam-travel-codebase-scout.md](./reports/vietnam-travel-codebase-scout.md)
