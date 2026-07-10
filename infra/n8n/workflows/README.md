# n8n workflows (TravelAI)

Checked-in workflow JSON for self-hosted n8n:

| File | Webhook path | Purpose |
|------|----------------|---------|
| `travel-chat.json` | `POST /webhook/travel-chat` | Concierge chat reply (HMAC) |
| `itinerary-generator.json` | itinerary | Multi-day plan |
| `destination-recommender.json` | recommend | Destination hints |

## Local mock (no full n8n UI)

```bash
# Terminal A — HMAC-compatible webhook stand-in for travel-chat
node scripts/mock-n8n-webhook.mjs 5678

# Terminal B — AI service
$env:N8N_WEBHOOK_BASE_URL = "http://127.0.0.1:5678/webhook"
$env:N8N_HMAC_SECRET = "travelai_n8n_hmac_dev_secret_change_me"
$env:AI_DEGRADED_MODE = "false"
```

Chat should return `degraded: false` when mock is up.

## Real n8n (compose)

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d n8n
# UI: http://127.0.0.1:55678  (admin / n8n_admin_dev)
# Import workflows/*.json and activate webhooks
```
