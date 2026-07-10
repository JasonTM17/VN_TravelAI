# AI / DeepSeek security audit — TravelAI

**HEAD:** `b49481d` · **Date:** 2026-07-10

---

## 1. Architecture

```
Web ChatbotWidget (JWT)
  → ai POST /v1/chat
  → rate limit redis rl:ai:chat:{userId} (fail-open)
  → HMAC signed body → N8N_WEBHOOK_BASE_URL
  → local: scripts/mock-n8n-webhook.mjs
  → callDeepSeekTravelChat (± tools)
  → degraded fallback on failure
Web may POST chat messages → api /v1/chat/messages (JWT ownership)
```

Evidence: `ai/src/main.ts`, `scripts/mock-n8n-webhook.mjs`, `scripts/lib/deepseek-travel-chat.mjs`, `api/src/routes/chat-history.ts`.

---

## 2. Controls

| Control | Status | Evidence |
|---------|--------|----------|
| Chat requires JWT | COMPLETE | requireAuth on /v1/chat |
| Per-user rate limit | COMPLETE fail-open | redis incr |
| Outbound HMAC | COMPLETE | n8n.ts signBody |
| Inbound HMAC raw body | COMPLETE | main.ts rawBody + hmac-guard |
| API key only in env | COMPLETE | DEEPSEEK_API_KEY not in repo |
| Degraded mode | COMPLETE | degraded.ts / AI_DEGRADED_MODE |
| Tool allowlist | COMPLETE | search_catalog, get_hotel/tour/destination only |
| Tool arg validation | COMPLETE | parseToolArgs slug/q sanitize |
| Max tool rounds | COMPLETE | max 3 |
| No book/admin tools | COMPLETE | ALLOWED set + tests |
| Streaming SSE | MISSING | intentional |
| RAG / vector | MISSING | intentional |
| Output HTML sanitize | PARTIAL | UI text nodes typical; no markdown HTML audit |
| PII redaction logs | MISSING | |
| Cost telemetry | MISSING | |

---

## 3. Threats

| Threat | Sev | Notes | Mitigation residual |
|--------|-----|-------|---------------------|
| Prompt injection | Medium | System rules only | Soft |
| Tool SSRF | Low | Fixed paths under API_BASE_URL public GET | Allowlist + no admin path |
| Tool booking abuse | N/A | No book tool | |
| HMAC replay | Medium | No nonce/timestamp on inbound probe | Partial (probe endpoint only) |
| Key leak in logs | Low | Avoid logging Authorization | Operational |
| Hallucinated prices | Medium | Tools ground catalog when enabled | Prompt + tools |

---

## 4. Tests present

- `scripts/lib/deepseek-travel-chat.test.mjs`  
- `scripts/lib/deepseek-tools.test.mjs`  
- `ai/src/lib/hmac.test.ts`  

**Missing:** end-to-end tool loop with live API mock in CI; prompt-injection corpus.

---

## 5. Recommendations (plan R*, not implemented here)

1. Dual-write stop: stop returning refresh in JSON (auth, not AI).  
2. Optional: strip tool results of unexpected fields.  
3. Render assistant text as text-only (no raw HTML).  
4. Add conversation retention/TTL policy if compliance needed.
