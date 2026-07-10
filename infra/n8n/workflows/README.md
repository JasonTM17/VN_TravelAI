# n8n workflows (TravelAI)

Checked-in workflow JSON for self-hosted n8n:

| File | Webhook path | Purpose |
|------|----------------|---------|
| `travel-chat.json` | `POST /webhook/travel-chat` | Concierge chat → **DeepSeek V4 Flash** (HMAC) |
| `itinerary-generator.json` | itinerary | Multi-day plan |
| `destination-recommender.json` | recommend | Destination hints |

## Live chat (DeepSeek V4 Flash)

Required env (host `.env` / compose — **placeholders only in git**):

| Name | Example | Notes |
|------|---------|--------|
| `DEEPSEEK_API_KEY` | *(your key)* | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Official V4 Flash id |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | OpenAI-compatible |

Without `DEEPSEEK_API_KEY`, chat-webhook returns **503** and the `ai` service responds with `degraded: true` (no 5xx to the browser).

## Local mock / compose (no n8n UI)

`docker-compose.local.yml` starts **`chat-webhook`** (runs `scripts/mock-n8n-webhook.mjs`) and points `ai` at it:

```bash
# Put DEEPSEEK_API_KEY in .env then:
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

# Or host-only mock:
node scripts/mock-n8n-webhook.mjs 5678
# AI: N8N_WEBHOOK_BASE_URL=http://127.0.0.1:5678/webhook
```

Unit tests (no network):

```bash
node --test scripts/lib/deepseek-travel-chat.test.mjs
```

## Real n8n UI (optional)

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d n8n
# UI: http://127.0.0.1:55678  (admin / n8n_admin_dev)
# Import workflows/travel-chat.json, set env DEEPSEEK_*, activate webhook
# Point AI N8N_WEBHOOK_BASE_URL back to http://n8n:5678/webhook if not using chat-webhook
```
