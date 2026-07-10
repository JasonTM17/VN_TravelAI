# Data flows

**Last verified:** `e715b96`

## 1. Catalog browse (SSR)

```
Browser → web page.tsx
       → fetch API_INTERNAL_URL or NEXT_PUBLIC_API_URL
       → api GET /v1/destinations|hotels|tours|promos
       → Prisma (± Meili for search pages)
```

Resilience: home uses `Promise.allSettled`.  
Evidence: `web/src/app/[locale]/page.tsx`, `web/src/lib/service-url.ts`, `api/src/routes/catalog.ts`.

## 2. Search

```
UI SearchHero /search → GET /v1/search?q=…
api → Meilisearch multi-index
filters → meili-filter sanitize
```

## 3. Authentication

```
register/login → identity
  → access JWT + refresh token
  → web saveSession(localStorage)
api/ai request + Authorization: Bearer
  → jose verify JWKS
401 → web refreshAccessToken → retry once
```

Evidence: `identity/src/routes/auth.ts`, `web/src/lib/api.ts`.

## 4. Booking (mock pay)

```
BookButton → POST /v1/bookings (+ Idempotency-Key)
  default: redirect /bookings (no auto-pay)
  optional NEXT_PUBLIC_BOOK_AUTOPAY=true → pay success
BookingsClient → POST .../pay {outcome}
               → POST .../cancel (canTransition)
```

Statuses: draft / pending_payment / confirmed / cancelled.  
Payment: **MOCK** only.

## 5. Wishlist

```
Auth user → GET/POST/DELETE /v1/wishlists
api stores WishlistItem (userId + type + id)
```

## 6. AI chat

```
ChatbotWidget (Bearer) → POST /v1/chat
ai → redis RL user → callN8nWebhook HMAC
  → chat-webhook|n8n → DeepSeek OR degraded template
response conversationId UUID (no message table)
```

## 7. Admin reindex

```
Admin UI → POST /v1/admin/reindex
Requires admin role JWT (+ optional X-Admin-Token)
api rebuilds Meili indexes from Postgres
```

## 8. Error / logging flow

- Validation: Zod → 400 problem/detail  
- Auth fail: 401  
- Rate limit: 429 where implemented  
- Logs: service logger; correlation `x-request-id`  
- Metrics: Prometheus text `/metrics`

## Related

- [System architecture](../system-architecture.md)
- [API overview](../api/overview.md)
