# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-09

### Added

- Monorepo TravelAI MVP: `web`, `api`, `identity`, `ai` services.
- Docker Compose stack: postgres, redis, meilisearch, minio, n8n + app services.
- Identity: Ed25519 JWT, JWKS, refresh rotation, account lockout, Redis rate limit.
- API: destinations/hotels/tours/flights catalog, Meilisearch, bookings, wishlists.
- AI orchestrator with n8n HMAC webhooks and offline degraded itineraries.
- Web: locale routes vi/en, design system, Grok Imagine visual pack, booking + AI UI.
- OpenAPI 3.1 contract, ADRs, CI (build/test/lint advisory, CodeQL, Trivy, Gitleaks), Docker Hub publish workflow.
- Playwright e2e smoke suite scaffold.

