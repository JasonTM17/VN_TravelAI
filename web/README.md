# web

## Purpose

Customer-facing TravelAI OTA UI (Next.js App Router). Talks to `identity`, `api`,
and `ai` over public HTTP — no Next.js API routes as production backend.

## API surface

Consumes OpenAPI contract at [`docs/openapi.yaml`](../docs/openapi.yaml):

- Catalog browse / search
- Auth pages
- Booking funnel
- AI Trip Planner UI

## Env vars

| name | required | default | description |
|------|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | no | http://localhost:3001 | Catalog API |
| NEXT_PUBLIC_IDENTITY_URL | no | http://localhost:3002 | Auth API |
| NEXT_PUBLIC_AI_URL | no | http://localhost:3003 | AI API |
| NEXT_PUBLIC_DEFAULT_LOCALE | no | vi | Default locale |

## Run locally

```bash
pnpm install
pnpm dev
# http://localhost:3000 → redirects to /vi
```

## Test

```bash
pnpm lint
pnpm build
# e2e: see /e2e (Playwright)
```

Coverage target ≥ 80% lines when unit tests land.

## Runbook

- **Locale:** routes under `/{vi|en}/...`
- **Empty catalog:** ensure `api` is seeded and Meilisearch reindexed
- **Images:** `public/images/**` Grok Imagine pack
