# 4. AI trip planner via n8n webhooks

Date: 2026-07-09

## Status

Accepted

## Context

TravelAI's differentiator is an AI trip planner. Embedding LLM SDKs directly in
app services couples credentials, retries, and prompt experiments to deploy cycles.

## Decision

- `ai` service is a thin orchestrator: auth, rate limit, validation, HMAC, degrade.
- LLM / automation logic lives in n8n workflows under `infra/n8n/workflows/`.
- All `ai` → n8n calls use `X-Signature-SHA256` HMAC of the raw JSON body.
- When n8n is unavailable or `AI_DEGRADED_MODE=true`, return structured offline
  itineraries and chat replies (no 500).

## Consequences

### Positive

- Swap model providers without redeploying app services
- Clear security boundary with HMAC
- Demo works without external LLM keys

### Negative

- Operators must import/activate n8n workflows

### Neutral

- Catalog hotel linking still uses `api` HTTP

## Alternatives considered

- Direct OpenAI/Anthropic SDK in `ai` — rejected as sole path
- Fully local LLM — future option behind same webhook interface

## References

- Global rule: n8n for workflow / chatbot
- ADR-0002 service split
