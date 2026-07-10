# TravelAI

Documentation: [English](README.md) · Vietnamese notes in product UI (`vi` default)

<p align="center">
  <img src="https://img.shields.io/badge/web-Next.js_15-black?logo=next.js" alt="Web">
  <img src="https://img.shields.io/badge/api-NestJS-ea2845?logo=nestjs" alt="API">
  <img src="https://img.shields.io/badge/identity-Ed25519_JWKS-2F6FED" alt="Identity">
  <img src="https://img.shields.io/badge/ai-n8n_orchestrator-18e46a" alt="AI">
  <img src="https://img.shields.io/badge/db-PostgreSQL-336791?logo=postgresql" alt="DB">
  <img src="https://img.shields.io/badge/search-Meilisearch-FF5CAA" alt="Search">
  <img src="https://img.shields.io/badge/docker-Hub-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

**TravelAI** — *Lên kế hoạch chuyến đi thông minh — Việt Nam & Thế giới.*

Traveloka-style travel marketplace (destinations, hotels, flights mock, tours) plus a dedicated **AI Trip Planner** concierge.

## Architecture

```mermaid
flowchart LR
  Browser --> Web[web :3000]
  Web --> Identity[identity :3002]
  Web --> API[api :3001]
  Web --> AI[ai :3003]
  API --> PG[(postgres)]
  API --> Redis[(redis)]
  API --> Meili[(meilisearch)]
  API --> MinIO[(minio)]
  Identity --> PG
  Identity --> Redis
  AI --> N8N[n8n :5678]
  AI --> API
```

| Service | Path | Port | Docker Hub |
|---------|------|------|------------|
| web | [`web/`](web/README.md) | 3000 | `nguyenson1710/travelai-web` |
| api | [`api/`](api/README.md) | 3001 | `nguyenson1710/travelai-api` |
| identity | [`identity/`](identity/README.md) | 3002 | `nguyenson1710/travelai-identity` |
| ai | [`ai/`](ai/README.md) | 3003 | `nguyenson1710/travelai-ai` |

Contract: [`docs/openapi.yaml`](docs/openapi.yaml) · ADRs: [`docs/adr/`](docs/adr/)

## Quick start (5 minutes)

```bash
cp .env.example .env
# Default ports (3000–3003). If they clash with other projects (e.g. FoodFlow):
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
# Web:      http://localhost:53000  (default compose: :3000)
# API:      http://localhost:53001/healthz
# Identity: http://localhost:53002/healthz
# AI:       http://localhost:53003/healthz
# n8n:      http://localhost:55678
# Local overlay sets NEXT_PUBLIC_* + CORS to the remapped host ports.
```

Demo user (local only): see `.env.example` (`DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`).

### Live chatbot (DeepSeek V4 Flash)

1. Create a key at [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys).
2. Put it in `.env` (never commit the real value):

```bash
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

3. Restart the chat webhook + AI:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d chat-webhook ai
```

4. Verify live replies:

```bash
node scripts/smoke-chat.mjs
# strict live gate (fails if still degraded):
# REQUIRE_LIVE=1 node scripts/smoke-chat.mjs
```

Without `DEEPSEEK_API_KEY`, chat still works offline with `degraded: true` (no 5xx).

## Packages (Docker Hub)

Images publish on push to `main` (`latest` + git SHA):

- `nguyenson1710/travelai-web`
- `nguyenson1710/travelai-api`
- `nguyenson1710/travelai-identity`
- `nguyenson1710/travelai-ai`

GitHub Actions secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

## Core capabilities (MVP)

- Explore destinations (Vietnam first + world hotspots)
- Browse hotels, tours, mock flights/transport
- Booking funnel with mock payment
- Accounts: auth, wishlist, booking history
- **AI Trip Planner**: chat + multi-day itinerary via n8n

## Non-goals (phase 1)

Real PSP settlement, Flutter apps, live GDS airline inventory, multi-vendor PMS.

## License

[MIT](LICENSE) © Nguyen Tien Son
