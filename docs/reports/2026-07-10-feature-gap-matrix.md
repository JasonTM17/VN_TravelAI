# Feature gap matrix — TravelAI

**HEAD:** `b49481d` · **Date:** 2026-07-10

Legend: COMPLETE / PARTIAL / MOCK / DISCONNECTED / BROKEN / MISSING / OUT_OF_SCOPE

| Feature | Frontend | API | Domain logic | Persistence | Security | Tests | Docs | Status | Evidence |
|---------|----------|-----|--------------|-------------|----------|-------|------|--------|----------|
| Home + promos | Y | Y | listPromos | Promo table | public | partial | Y | COMPLETE demo | home page, catalog |
| Destinations | Y | Y | CRUD read | Destination | public | partial | Y | COMPLETE demo | routes + pages |
| Hotels + gallery | Y | Y | images[] | Hotel | public | gallery unit | Y | COMPLETE demo | media screenshots |
| Tours | Y | Y | read | Tour | public | partial | Y | COMPLETE demo | |
| Flights search | Y | Y | seed inventory | Flight+seatsLeft | public | inventory unit | Y | COMPLETE mock inventory | |
| Transport list | Y | Y | seatsLeft | Transport | public | inventory | Y | COMPLETE demo | |
| Transport book | Y | Y | create+pay seats | Booking transport | JWT+owner | inventory | Y | COMPLETE demo | book-button, bookings.ts |
| Search Meili | Y | Y | multi-index | Meili | filter sanitize | meili-filter tests | Y | COMPLETE | |
| Auth | Y | Y | lockout+RL | User/Refresh | Ed25519+cookie | keys/cookie tests | Y | COMPLETE demo | identity |
| Session refresh | Y | Y | cookie+JSON compat | RefreshToken | httpOnly cookie | unit | PARTIAL docs | COMPLETE path | refresh-cookie, api.ts |
| Wishlist | Y | Y | unique user+item | WishlistItem | JWT | partial | Y | COMPLETE demo | |
| Booking create/list | Y | Y | state machine | Booking | JWT owner | booking-state | Y | COMPLETE demo | |
| Mock pay | Y | Y | applyPayment | PaymentAttempt | JWT | unit | Y | **MOCK** | no PSP |
| Cancel + seat restore | Y | Y | canTransition | Booking | JWT | unit | Y | COMPLETE demo | |
| Real PSP/refund | N | N | N | N | N | N | N | **MISSING** | product decision |
| Hotel room inventory | N | N | N | N | N | N | N | **MISSING** | YAGNI residual |
| Chatbot UI | Y | ai chat | degrade | optional chat_* | JWT chat | scripts | Y | PARTIAL | no stream |
| Chat history | Y | api chat routes | ownership | Chat* tables | JWT | partial | Y | COMPLETE path | chat-history.ts |
| Tool-calling | via webhook | tools | read-only tools | N | no admin tools | deepseek-tools tests | Y | COMPLETE path | |
| RAG/embeddings | N | N | N | N | N | N | N | **MISSING** | intentional |
| AI itinerary | Y | ai+api persist | Map+DB | Itinerary | JWT | partial | Y | PARTIAL | in-memory Map on ai |
| Admin reindex | Y | Y | reindexAll | AdminAuditLog | admin+token | partial | Y | PARTIAL | |
| Reviews write | display seed | N write API | N | Review seed | N | N | PARTIAL | PARTIAL | read-only display |
| Notifications/email | N | N | N | N | N | N | N | **MISSING** | |
| MinIO media | N | N | N | compose only | surface | N | note | **DISCONNECTED** | no S3 client in app |
| Traveloka integration | N | N | N | N | N | N | N | **OUT_OF_SCOPE** | |
| GHCR/Hub packages | N/A | N/A | workflow | registries | secrets | N | README | **BROKEN ops** | billing |

## Frontend ↔ API mismatches

| Issue | Status | Evidence |
|-------|--------|----------|
| e2e expects localStorage access token | DRIFT | `e2e/tests/auth-register-change-password.spec.ts` vs `auth-storage.ts` sessionStorage |
| Generated OpenAPI client not primary runtime | PARTIAL | `web/src/generated/openapi.ts` vs `web/src/lib/api.ts` |
| refreshToken still in login JSON | COMPAT residual | `identity/src/routes/auth.ts` |

## Backend unused by FE (examples)

| Surface | Notes |
|---------|-------|
| `/metrics` | Not called by web (observability) |
| n8n real workflows | Local prefers chat-webhook |
| MinIO | No FE/BE media upload |

## Fake / mock surfaces (honest)

- Mock payment outcome string  
- Flight/transport inventory is soft seats, not GDS  
- Seed catalog scale for demo  
- DeepSeek degraded template when key missing  
