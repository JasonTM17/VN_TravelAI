# DeepSeek chatbot & itinerary

**Status:** COMPLETE path (live LLM khi có key; degraded fallback) · **Last verified:** `9f4d424`

## 1. Architecture

```
web ChatbotWidget / AI page
  → ai POST /v1/chat | /v1/chat/stream (JWT)
  → catalog RAG: API Meili search + /v1/search/vectors
  → HMAC sign body (N8N_HMAC_SECRET)
  → N8N_WEBHOOK_BASE_URL
       local: chat-webhook (scripts/mock-n8n-webhook.mjs)
       base:  n8n container
  → DeepSeek Chat Completions (+ read-only tools, max 3 rounds)
  → on fail / no key: degraded template (degraded: true)
  → optional: api chat-history persist
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
| `API_BASE_URL` (ai) | Catalog RAG against api |
| `EMBEDDING_API_KEY` / `PINECONE_*` | Optional better vectors (api) |

Implementation: `scripts/lib/deepseek-travel-chat.mjs`, `ai/src/lib/catalog-rag.ts`, `api/src/lib/vector-store.ts`.

## 3. Security controls (present)

| Control | Status | Notes |
|---------|--------|-------|
| JWT on chat | COMPLETE | |
| Per-user Redis rate limit | COMPLETE | fail-open if redis down |
| Outbound HMAC sign | COMPLETE | |
| Inbound HMAC raw body | COMPLETE | `ai/src/main.ts` rawBody |
| Tool calling (read-only catalog) | COMPLETE path | `scripts/lib/deepseek-tools.mjs`; max 3 rounds; public GET only |
| Catalog RAG (Meili + vectors) | COMPLETE path | no PII; public catalog only |
| Prompt injection hard filter | PARTIAL | system prompt + basic guards |
| PII redaction | NOT IMPLEMENTED | |
| Cost telemetry | NOT IMPLEMENTED | |

## 4. Implemented capabilities

| Capability | Status |
|------------|--------|
| Non-stream chat `POST /v1/chat` | COMPLETE path |
| SSE stream `POST /v1/chat/stream` | COMPLETE path |
| Conversation / message persistence | COMPLETE path (`api` chat-history) |
| Meili keyword RAG | COMPLETE path |
| Vector embeddings + Pinecone/Postgres | COMPLETE path (optional keys) |
| Read-only tool-calling to catalog | COMPLETE path |
| Itinerary generate | COMPLETE path (in-memory + optional persist) |

## 5. Still out of scope

- Agent that mutates bookings / payments
- Multi-replica shared itinerary store only (Map is process-local; DB persist is separate)
- Enterprise prompt firewall / PII redaction pipeline

## 6. Operator steps (local)

```bash
# .env: DEEPSEEK_API_KEY=...
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --force-recreate chat-webhook ai
node scripts/smoke-chat.mjs
# optional semantic index:
# POST /v1/admin/reindex-vectors (admin JWT)
```

Without key: chat still returns **degraded** content (usable demo).

## 7. Related

- [ai/README](../../ai/README.md)
- [Troubleshooting](../operations/troubleshooting.md)
