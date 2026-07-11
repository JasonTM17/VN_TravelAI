# DeepSeek chatbot & itinerary

**Status:** COMPLETE path (live LLM khi có key; degraded fallback) · **Last verified:** `a796b94` (2026-07-11)

## 1. Architecture

Hai endpoint chat có pipeline khác nhau:

| Path | Runtime path | Có | Không có |
|------|--------------|----|----------|
| `POST /v1/chat` | AI → Redis rate limit → ký HMAC trên đúng JSON bytes → n8n hoặc local `chat-webhook` → DeepSeek/degraded | webhook, read-only tools trong webhook | catalog RAG trực tiếp của AI, SSE |
| `POST /v1/chat/stream` | AI → shared Redis rate limit → API catalog RAG → DeepSeek trực tiếp → SSE/degraded stream | parallel Meili/vector context, abort khi client ngắt | HMAC/webhook tools, server-side persistence |

`ChatbotWidget` gửi tối đa 10 message gần nhất làm bounded conversation context, lưu conversation ID trong `sessionStorage`, và best-effort ghi user/assistant message sang API chat-history sau khi nhận kết quả. API ownership bảo vệ restore; thành công của endpoint AI vẫn không bảo đảm message đã được persist.

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

Compose forwards these optional keys to their consuming services. A fresh stack still needs admin `POST /v1/admin/reindex-vectors` before vector retrieval has catalog rows; without external embedding credentials the fallback is a deterministic demo hash vector, not production semantic quality.

Implementation: `scripts/lib/deepseek-travel-chat.mjs`, `ai/src/lib/catalog-rag.ts`, `api/src/lib/vector-store.ts`.

## 3. Security controls (present)

| Control | Status | Notes |
|---------|--------|-------|
| JWT on chat | COMPLETE | |
| Per-user Redis rate limit | Both chat paths | shared 20/min fixed window; fail-open if redis down |
| Outbound HMAC sign | `/v1/chat` only | serialize once; sign and send identical bytes |
| Inbound HMAC raw body | callback only | exact parser-captured bytes; callback is acceptance probe, not result ingestion |
| Tool calling (read-only catalog) | webhook path only | `scripts/lib/deepseek-tools.mjs`; max 3 rounds; public GET only |
| Catalog RAG (Meili + vectors) | stream path only | parallel retrieval, bounded untrusted-data context; public catalog only |
| Prompt injection hard filter | PARTIAL | system prompt + basic guards |
| PII redaction | NOT IMPLEMENTED | |
| Cost telemetry | NOT IMPLEMENTED | |

## 4. Implemented capabilities

| Capability | Status |
|------------|--------|
| Non-stream chat `POST /v1/chat` | COMPLETE path |
| SSE stream `POST /v1/chat/stream` | COMPLETE path; abort/disconnect lifecycle handled |
| Conversation / message persistence | Client best-effort (`web` → API chat-history), not part of AI response transaction |
| Meili keyword RAG | Stream path only |
| Vector embeddings + Pinecone/Postgres | COMPLETE path (optional keys) |
| Read-only tool-calling to catalog | Non-stream webhook path only |
| Itinerary generate | COMPLETE path (in-memory + optional persist) |

## 5. Still out of scope

- Agent that mutates bookings / payments
- Multi-replica shared itinerary store only (Map is process-local; DB persist is separate)
- Server-owned transactional conversational memory (current restore is session-scoped and persistence remains client best-effort)
- Structured catalog citations/source links and calibrated vector similarity threshold
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
