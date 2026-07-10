# System architecture

## Services

```
Browser → web (Next.js 15)
        → identity (Fastify, Ed25519 JWT/JWKS, refresh, lockout)
        → api (catalog, Meili, bookings mock-pay, wishlist, admin)
        → ai (chat/itinerary → n8n or chat-webhook → DeepSeek; degraded fallback)
Data: postgres (catalog + identity DBs), redis, meilisearch
```

## Auth

1. Register/login at identity → access JWT + opaque refresh  
2. Web stores tokens in `localStorage`; refreshes on 401 via single-flight  
3. api/ai verify JWKS (`/.well-known/jwks.json`, dual key slots)

## Booking

Create → `pending_payment` → mock pay → `confirmed` | cancel via state machine (`canTransition`).

## AI chat

`POST /v1/chat` (JWT) → HMAC webhook → DeepSeek or degraded template. No RAG/tool-calling in current design (ADR-0004).

## Observability

- `/healthz`, `/readyz`, `/metrics` on services  
- `x-request-id` on api/identity/ai responses  

See ADRs under `docs/adr/` and scout report `docs/reports/vietnam-travel-codebase-scout.md`.
