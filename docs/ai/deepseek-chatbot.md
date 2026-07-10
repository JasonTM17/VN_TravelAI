# DeepSeek chatbot & itinerary

**Status:** PARTIAL live path · **Last verified:** `e715b96`

## 1. Architecture

```
web ChatbotWidget / AI page
  → ai POST /v1/chat | /v1/itineraries (JWT)
  → HMAC sign body (N8N_HMAC_SECRET)
  → N8N_WEBHOOK_BASE_URL
       local: chat-webhook (scripts/mock-n8n-webhook.mjs)
       base:  n8n container
  → DeepSeek Chat Completions HTTP
  → on fail / no key: degraded template (degraded: true)
```

ADR: [0004-ai-via-n8n](../adr/0004-ai-via-n8n.md).

## 2. Configuration

| Var | Role |
|-----|------|
| `DEEPSEEK_API_KEY` | Required for live replies |
| `DEEPSEEK_MODEL` | Default `deepseek-v4-flash` |
| `DEEPSEEK_BASE_URL` | Default `https://api.deepseek.com` |
| `N8N_WEBHOOK_BASE_URL` | Webhook target |
| `N8N_HMAC_SECRET` | Shared HMAC |
| `AI_DEGRADED_MODE` | Force offline |

Implementation: `scripts/lib/deepseek-travel-chat.mjs`.

## 3. Security controls (present)

| Control | Status |
|---------|--------|
| JWT on chat | COMPLETE |
| Per-user Redis rate limit | COMPLETE (fail-open if redis down) |
| Outbound HMAC sign | COMPLETE |
| Inbound HMAC raw body | COMPLETE (`ai/src/main.ts` rawBody) |
| Tool calling (read-only catalog) | COMPLETE path | `scripts/lib/deepseek-tools.mjs`; max 3 rounds; public GET only |
| Prompt injection hard filter | PARTIAL (system prompt only) |
| PII redaction | NOT IMPLEMENTED |
| Cost telemetry | NOT IMPLEMENTED |

## 4. NOT IMPLEMENTED (do not document as features)

- Streaming SSE  
- Conversation message persistence  
- RAG / embeddings / vector DB  
- Function/tool calling to catalog or booking  
- Multi-replica shared itinerary store (in-memory Map only)

## 5. Operator steps (local)

```bash
# .env: DEEPSEEK_API_KEY=...
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --force-recreate chat-webhook ai
node scripts/smoke-chat.mjs
```

Without key: chat still returns **degraded** content (usable demo).

## 6. Related

- [ai/README](../../ai/README.md)
- [Troubleshooting](../operations/troubleshooting.md)
