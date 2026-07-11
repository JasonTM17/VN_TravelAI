# 2. Service split and technology stack

Date: 2026-07-09

## Status

Superseded in part by [ADR-0003](./0003-fastify-backends.md): the service split remains accepted, while API and identity use Fastify rather than NestJS. MinIO remains an optional disconnected profile, not an active application data plane.

## Context

Global project rules require backend/frontend separation, containerization per
service, and responsibility-based naming. TravelAI needs auth, catalog/booking,
AI orchestration, and a customer web UI.

## Decision

Monorepo services:

| Name | Responsibility | Stack |
|------|----------------|-------|
| `web` | Customer UI | Next.js 15 App Router, TypeScript, Tailwind |
| `api` | Catalog, search, bookings, wishlists | NestJS, Prisma, PostgreSQL |
| `identity` | Registration, login, JWKS, refresh | NestJS, Prisma, Ed25519 JWT |
| `ai` | Trip planner orchestrator | Node (Fastify/Express), HMAC → n8n |

Data plane: PostgreSQL (separate DBs `travelai` / `travelai_identity`), Redis
(rate limits / cache), Meilisearch (full-text), MinIO (media), n8n (LLM workflows).

Docker Hub: `nguyenson1710/travelai-<service>`.

## Consequences

### Positive

- Independent scale and deploy
- Clear auth boundary via JWKS
- AI provider changes without redeploying `api`/`web`

### Negative

- More compose/CI surface area than a monolith

### Neutral

- MVP uses mock flights and mock payments

## Alternatives considered

- Monolithic Next.js API routes — rejected (blast radius, scale)
- Single NestJS for identity+api — deferred; separate identity keeps JWKS clean

## References

- FoodFlow monorepo patterns
- Project global architecture rules
