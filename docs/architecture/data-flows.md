# Data flows

**Last verified:** `a796b94` (2026-07-11)

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
  → POST /v1/bookings (+ Idempotency-Key bound to the request payload)
  → hotel: availability check for room type; price from rate plan (no reservation yet)
  default: redirect /bookings
  optional NEXT_PUBLIC_BOOK_AUTOPAY → pay success
BookingsClient → atomic POST .../pay {outcome}
               → decrement seats/nights once + notifyBookingConfirmed
               → atomic POST .../cancel (restore once if previously confirmed)
```

Payment: **MOCK** only. Inventory is atomically consumed on successful pay, not create. Duplicate/retried transitions are transaction-protected. Notification is fire-and-forget after commit, so confirmed does not guarantee email delivery.

## 5. Wishlist & reviews

```
Auth → wishlist CRUD
Auth → POST /v1/reviews (hotelId or tourId)
```

## 6. AI chat

```
Non-stream: ChatbotWidget → POST /v1/chat (Bearer)
  → Redis RL → sign/send identical JSON bytes via HMAC webhook
  → n8n/chat-webhook → DeepSeek read-only tools OR degraded

Stream: ChatbotWidget → POST /v1/chat/stream (Bearer)
  → bounded recent conversation history (max 10 messages)
  → shared Redis RL → retrieveCatalogContext(API Meili + vectors in parallel)
  → direct DeepSeek SSE (meta → token* → done) OR degraded SSE

After either response, web best-effort persists messages via API chat-history and stores the conversation ID for session restore.
```

## 7. Admin reindex

```
Admin UI → POST /v1/admin/reindex          (Meili)
         → POST /v1/admin/reindex-vectors  (embeddings)
Requires admin role JWT (+ optional X-Admin-Token)
```

## 8. Error / logging

- Validation: Zod → 400; problem-detail shape is not yet uniform across services
- Auth fail: 401  
- Rate limit: 429 where implemented  
- Logs: service logger; correlation `x-request-id`  
- Metrics: Prometheus text `/metrics` (optional token)

## Related

- [System architecture](../system-architecture.md)
- [API overview](../api/overview.md)
