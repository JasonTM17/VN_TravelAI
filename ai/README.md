# ai

## Purpose

TravelAI Concierge orchestrator. Accepts chat (JSON + SSE) and itinerary requests from `web`, verifies JWT via identity JWKS, retrieves catalog context from `api` (Meili + vectors), signs HMAC webhooks to n8n/`chat-webhook`, and returns structured replies. Falls back to degraded offline templates when webhook/LLM fails.

## API surface

- `POST /v1/chat` — JWT; catalog RAG; HMAC to n8n/chat-webhook; degrade if fail
- `POST /v1/chat/stream` — SSE token stream
- `POST /v1/itineraries` · `GET /v1/itineraries/:id`
- `POST /v1/hooks/n8n-callback` — inbound HMAC (raw JSON body)
- `/healthz` · `/readyz` (includes `redis`) · `/metrics`

## DeepSeek (local compose)

Local overlay points `N8N_WEBHOOK_BASE_URL` at `chat-webhook` (`scripts/mock-n8n-webhook.mjs`), which calls DeepSeek when `DEEPSEEK_API_KEY` is set (model default `deepseek-v4-flash`). Without key or on error, AI returns `degraded: true` template replies.

**Implemented path:** Meili + vector RAG (`catalog-rag.ts`), read-only tool-calling (`scripts/lib/deepseek-tools.mjs`), SSE stream.

HMAC: outbound and inbound use body bytes; AI parser keeps `rawBody` for verify.

## Env vars

| name | required | default | description |
|------|----------|---------|-------------|
| PORT | no | 3003 | HTTP port |
| N8N_WEBHOOK_BASE_URL | no | http://n8n:5678/webhook | n8n or chat-webhook base |
| N8N_HMAC_SECRET | yes (prod) | dev secret | HMAC shared secret |
| AI_DEGRADED_MODE | no | false | Force offline plans |
| IDENTITY_JWKS_URL | yes | — | JWKS URL |
| API_BASE_URL | no | http://api:3001 | Catalog + vector RAG |
| CORS_ORIGINS | no | localhost list | Comma allowlist |
| METRICS_TOKEN | no | open | Gate metrics when set |

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
- **Rotate HMAC:** update secret in `ai` and n8n/chat-webhook together
- **Import workflows:** `infra/n8n/workflows/*.json` into n8n UI
- **Live chat:** set `DEEPSEEK_API_KEY`, recreate chat-webhook + ai
- **Docs:** [DeepSeek chatbot](../docs/ai/deepseek-chatbot.md)
