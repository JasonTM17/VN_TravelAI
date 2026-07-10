# ai

## Purpose

TravelAI Concierge orchestrator. Accepts chat and itinerary requests from `web`,
verifies JWT via identity JWKS, signs HMAC webhooks to n8n, and returns structured
itineraries. Falls back to degraded offline plans when n8n is down.

## API surface

- `POST /v1/chat` — JWT required; HMAC to n8n/chat-webhook; degrade if webhook fails
- `POST /v1/itineraries` · `GET /v1/itineraries/:id`
- `POST /v1/hooks/n8n-callback` — inbound HMAC (raw JSON body)
- `/healthz` · `/readyz` (includes `redis` up/down) · `/metrics`

## DeepSeek (local compose)

Local overlay points `N8N_WEBHOOK_BASE_URL` at `chat-webhook` (`scripts/mock-n8n-webhook.mjs`), which calls DeepSeek when `DEEPSEEK_API_KEY` is set (model default `deepseek-v4-flash`). Without key or on error, AI returns `degraded: true` template replies. No RAG / tool-calling in this service.

HMAC: outbound and inbound use body bytes; AI parser keeps `rawBody` for verify.

## Env vars

| name | required | default | description |
|------|----------|---------|-------------|
| PORT | no | 3003 | HTTP port |
| N8N_WEBHOOK_BASE_URL | no | http://n8n:5678/webhook | n8n or chat-webhook base |
| N8N_HMAC_SECRET | yes (prod) | dev secret | HMAC shared secret |
| AI_DEGRADED_MODE | no | false | Force offline plans |
| IDENTITY_JWKS_URL | yes | — | JWKS URL |
| API_BASE_URL | no | http://api:3001 | Catalog linkage |
| CORS_ORIGINS | no | localhost list | Comma allowlist |

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
