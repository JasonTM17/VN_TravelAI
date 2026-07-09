# 7. Meilisearch for catalog full-text search

Date: 2026-07-09

## Status

Accepted

## Context

OTA discovery needs typo-tolerant, multi-index search across destinations, hotels,
and tours. Postgres `ILIKE` alone is insufficient for product-quality search UX.

## Decision

- Run Meilisearch as a compose service.
- On boot / `POST /v1/admin/reindex`, `api` indexes documents into:
  `destinations`, `hotels`, `tours`.
- List endpoints accept `q` and prefer Meilisearch when present; SQL filters
  remain for structured filters (price, stars, destination slug).
- Unified `GET /v1/search?q=` fans out to the three indexes.

Transport (bus/train) remains SQL-filterable inventory (smaller, code-based
routes); can be indexed later without changing the external contract style.

## Consequences

### Positive

- Fast Vietnamese/English free-text search
- Independent scale of search vs OLTP

### Negative

- Eventual consistency after seed until reindex

## Alternatives considered

- Postgres full-text only — weaker UX for MVP polish bar
- Elasticsearch — heavier ops for this stack

## References

- ADR-0002 service split
- `api/src/lib/meili.ts`
