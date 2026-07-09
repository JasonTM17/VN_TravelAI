# ai

## Purpose

TravelAI Concierge orchestrator. Accepts chat and itinerary requests from `web`,
verifies JWT via identity JWKS, signs HMAC webhooks to n8n, and returns structured
itineraries. Falls back to degraded offline plans when n8n is down.

## API surface

- `POST /v1/chat`
- `POST /v1/itineraries`
- `GET /v1/itineraries/:id`
- `/healthz` · `/readyz` · `/metrics`

## Env vars

| name | required | default | description |
|------|----------|---------|-------------|
| PORT | no | 3003 | HTTP port |
| N8N_WEBHOOK_BASE_URL | no | http://n8n:5678/webhook | n8n webhooks |
| N8N_HMAC_SECRET | yes (prod) | dev secret | HMAC shared secret |
| AI_DEGRADED_MODE | no | false | Force offline plans |
| IDENTITY_JWKS_URL | yes | — | JWKS URL |
| API_BASE_URL | no | http://api:3001 | Catalog linkage |

## Run locally

```bash
pnpm install
pnpm dev
```

## Test

```bash
pnpm test
```

## Runbook

- **Force degraded:** `AI_DEGRADED_MODE=true`
- **Rotate HMAC:** update secret in `ai` and n8n workflow credentials together
- **Import workflows:** `infra/n8n/workflows/*.json` into n8n UI
