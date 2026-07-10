# Data flows

**Last verified:** `9f4d424`

## 1. Catalog browse (SSR)

```
Browser → web page.tsx
       → fetch API_INTERNAL_URL or NEXT_PUBLIC_API_URL
       → api GET /v1/destinations|hotels|tours|promos
       → Prisma (± Meili for search pages)
```

Hotel detail includes `roomTypes[].ratePlans`.  
Resilience: home uses `Promise.allSettled`.

## 2. Search

```
UI SearchHero /search → GET /v1/search?q=…
api → Meilisearch multi-index
filters → meili-filter sanitize

Optional semantic:
  GET /v1/search/vectors?q=… → embedText → Pinecone or PG cosine
```

## 3. Authentication

```
register/login → identity
  → access JWT + httpOnly refresh cookie (identity origin)
  → web saveSession(access in memory; optional sessionStorage)
api/ai request + Authorization: Bearer
  → jose verify JWKS
401 → web refreshAccessToken (credentials: include) → retry once
```

Evidence: `identity` auth routes, `web/src/lib/auth-storage.ts`, `web/src/lib/api.ts`.

## 4. Booking (mock pay + PMS)

```
BookButton (± roomTypeId, ratePlanId)
  → POST /v1/bookings (+ Idempotency-Key)
  → hotel: ensure night inventory for room type; price from rate plan
  default: redirect /bookings
  optional NEXT_PUBLIC_BOOK_AUTOPAY → pay success
BookingsClient → POST .../pay {outcome}
               → decrement seats/nights + notifyBookingConfirmed
               → POST .../cancel (restore if confirmed)
```

Payment: **MOCK** only. Email: SMTP / HTTP gateway / log.

## 5. Wishlist & reviews

```
Auth → wishlist CRUD
Auth → POST /v1/reviews (hotelId or tourId)
```

## 6. AI chat

```
ChatbotWidget (Bearer)
  → POST /v1/chat or /v1/chat/stream
  → ai retrieveCatalogContext(API Meili + vectors)
  → redis RL → HMAC webhook → DeepSeek tools OR degraded
  → optional persist messages via api chat-history
```

## 7. Admin reindex

```
Admin UI → POST /v1/admin/reindex          (Meili)
         → POST /v1/admin/reindex-vectors  (embeddings)
Requires admin role JWT (+ optional X-Admin-Token)
```

## 8. Error / logging

- Validation: Zod → 400 problem/detail  
- Auth fail: 401  
- Rate limit: 429 where implemented  
- Logs: service logger; correlation `x-request-id`  
- Metrics: Prometheus text `/metrics` (optional token)

## Related

- [System architecture](../system-architecture.md)
- [API overview](../api/overview.md)
