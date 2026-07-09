# 5. i18n via locale-prefixed App Router routes

Date: 2026-07-09

## Status

Accepted

## Context

TravelAI targets Vietnamese travelers first with English secondary. SEO and
share previews need locale-aware URLs.

## Decision

- Default locale: `vi`
- Routes: `/{locale}/...` with middleware redirect from `/` → `/vi`
- Dictionaries in `web/src/lib/i18n.ts` (lightweight, no full next-intl dependency for MVP)
- Locale switcher rewrites path prefix

## Consequences

### Positive

- Clear SEO URLs
- Simple implementation without heavy i18n framework for MVP

### Negative

- Manual dictionary maintenance

## Alternatives considered

- next-intl — can migrate later without changing URL scheme
- Cookie-only locale — worse for SEO

## References

- FoodFlow i18n ADR patterns
