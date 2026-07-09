# 3. Fastify backends for identity, api, ai

Date: 2026-07-09

## Status

Accepted

## Context

The original goal recommended NestJS for `api` and `identity`. NestJS is excellent
for large module graphs but adds ceremony for a greenfield MVP with a clear OpenAPI
contract and thin service boundaries.

## Decision

Implement `identity`, `api`, and `ai` as **TypeScript + Fastify** services with:

- Zod request validation on every mutating route
- Prisma for PostgreSQL
- Shared response envelope `{ success, data, meta? }`
- `/healthz`, `/readyz`, `/metrics`

OpenAPI in `docs/openapi.yaml` remains the canonical contract; FE generates clients
from it regardless of framework.

## Consequences

### Positive

- Smaller images, faster cold start
- Explicit middleware chain (request-id → auth → validate → handler)
- Easier Docker multi-stage builds

### Negative

- Less Nest DI sugar; modules are plain folders

### Neutral

- Can migrate a service to NestJS later without changing external contracts

## Alternatives considered

- NestJS everywhere — deferred for MVP velocity
- Go services — higher upfront cost for this team’s Node patterns

## References

- ADR-0002 service split
