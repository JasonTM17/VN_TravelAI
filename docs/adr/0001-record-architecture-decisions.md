# 1. Record architecture decisions

Date: 2026-07-09

## Status

Accepted

## Context

TravelAI is a multi-service travel platform. Without a lightweight decision log,
architectural choices (auth algorithm, AI orchestration, search engine) will
drift between contributors and sessions.

## Decision

We will record architecture decisions as Architecture Decision Records (ADRs)
under `docs/adr/`, using the template in `docs/adr/template.md`.

- One decision per file, numbered `NNNN-slug.md`
- ADRs are append-only; accepted ADRs are not edited — supersede instead
- Required for auth, AI, search, i18n, and any breaking contract change

## Consequences

### Positive

- Traceable rationale for stack choices
- Faster onboarding and safer refactors

### Negative

- Small documentation overhead per decision

### Neutral

- Public ADRs only — private plans stay in `plans/` (gitignored)

## Alternatives considered

- Wiki-only docs — harder to review in PRs
- Inline README essays — mix product and decision history

## References

- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
