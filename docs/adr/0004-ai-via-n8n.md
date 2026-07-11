# 4. AI trip planner via n8n webhooks

Date: 2026-07-09

## Status

Superseded in part (2026-07-11). Non-stream chat still follows this webhook boundary. Streaming chat intentionally uses a direct DeepSeek path with catalog RAG; the local `chat-webhook` also hosts read-only tool logic.

## Context

TravelAI's differentiator is an AI trip planner. Embedding LLM SDKs directly in
app services couples credentials, retries, and prompt experiments to deploy cycles.

## Decision

- `ai` service is a thin orchestrator: auth, rate limit, validation, HMAC, degrade.
- Non-stream LLM / automation logic lives in n8n or the compatible local `chat-webhook`.
- Non-stream `ai` → webhook calls use `X-Signature-SHA256` HMAC over the exact serialized JSON bytes sent.
- `/v1/chat/stream` shares the Redis rate limit, retrieves catalog context in parallel, and calls DeepSeek directly to preserve token streaming and client-abort propagation. It does not use the webhook or its tools.
- When n8n is unavailable or `AI_DEGRADED_MODE=true`, return structured offline
  itineraries and chat replies (no 500).

## Consequences

### Positive

- Swap model providers without redeploying app services
- Clear security boundary with HMAC
- Demo works without external LLM keys

### Negative

- Operators must import/activate n8n workflows
- Operators maintain two chat paths with different rate-limit, tool and persistence semantics

### Neutral

- Catalog hotel linking still uses `api` HTTP

## Alternatives considered

- Direct OpenAI/Anthropic SDK in `ai` — rejected as sole path
- Fully local LLM — future option behind same webhook interface

## References

- Global rule: n8n for workflow / chatbot
- ADR-0002 service split
