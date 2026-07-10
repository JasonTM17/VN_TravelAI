# TravelAI

<p align="center">
  <img src="docs/media/demo-walkthrough.gif" alt="TravelAI demo walkthrough" width="720" />
</p>

<p align="center">
  <strong>Lên kế hoạch chuyến đi thông minh — Việt Nam &amp; Thế giới</strong><br/>
  Marketplace du lịch kiểu Traveloka + AI concierge (DeepSeek V4 Flash) · monorepo Docker
</p>

<p align="center">
  <img src="https://img.shields.io/badge/web-Next.js_15-black?logo=next.js" alt="Web" />
  <img src="https://img.shields.io/badge/api-Fastify-000000?logo=fastify" alt="API" />
  <img src="https://img.shields.io/badge/identity-Ed25519_JWKS-2F6FED" alt="Identity" />
  <img src="https://img.shields.io/badge/ai-DeepSeek_V4_Flash-4D6BFE" alt="AI" />
  <img src="https://img.shields.io/badge/db-PostgreSQL-336791?logo=postgresql" alt="DB" />
  <img src="https://img.shields.io/badge/search-Meilisearch-FF5CAA" alt="Search" />
  <img src="https://img.shields.io/badge/docker-Hub%20%2B%20GHCR-2496ED?logo=docker" alt="Docker" />
  <a href="https://github.com/JasonTM17/VN_TravelAI/releases"><img src="https://img.shields.io/github/v/release/JasonTM17/VN_TravelAI?include_prereleases&label=release" alt="Release" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

<p align="center">
  <strong>Project status:</strong> MVP demo + production <em>hardening baseline</em> trên monorepo service-split.<br/>
  Payment = <strong>MOCK</strong> · AI chat = <strong>PARTIAL</strong> (DeepSeek live khi có key; không RAG/tool-calling) · Cloud deploy target = <strong>UNKNOWN</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#ai--deepseek">AI</a> ·
  <a href="#releases--packages">Releases</a> ·
  <a href="docs/README.md">Documentation</a>
</p>

---

## Điểm nổi bật

| Highlight | Status |
|-----------|--------|
| Live catalog (seed Postgres) + promo carousel | COMPLETE |
| Hotels / tours list, detail, multi-image gallery | COMPLETE |
| Meilisearch unified search | COMPLETE |
| Ed25519 JWT + dual JWKS identity + client refresh | COMPLETE |
| Booking lifecycle + **mock** pay / cancel state machine | COMPLETE + MOCK pay |
| Global chatbot + AI itinerary planner (DeepSeek path) | PARTIAL |
| Admin reindex + audit | PARTIAL |
| Responsive mobile web | COMPLETE (demo UX) |
| Docker Compose multi-service · Hub + GHCR · Releases | COMPLETE tooling |

---

## Screenshots

| Home + live catalog stats | Hotels list + pagination |
|:---:|:---:|
| ![Home](docs/media/01-home.png) | ![Hotels](docs/media/02-hotels.png) |

| Multi-slide hotel gallery | Tours catalog |
|:---:|:---:|
| ![Gallery](docs/media/03-hotel-gallery.png) | ![Tours](docs/media/04-tours.png) |

| Global chatbot | Admin console |
|:---:|:---:|
| ![Chatbot](docs/media/06-chatbot.png) | ![Admin](docs/media/07-admin.png) |

| AI planner | Mobile gallery (~390px) |
|:---:|:---:|
| ![AI](docs/media/08-ai-planner.png) | ![Mobile](docs/media/10-mobile-gallery.png) |

More assets: [`docs/media/`](docs/media/README.md) (gồm `05-explore`, `09-mobile-home`, gallery slides, frames)

---

## Features

- **Catalog (seeded Postgres)**: 40+ destinations · 140+ hotels · 120+ tours · flights & transport · multi-image galleries from DB `images[]`
- **Home promos**: data-driven `GET /v1/promos` (not hard-coded product cards)
- **Search**: Meilisearch reindex after boot / admin
- **Auth**: Ed25519 JWT + dual JWKS (identity); web refresh on 401
- **AI concierge**: chat + itinerary via n8n/HMAC; **DeepSeek V4 Flash** when `DEEPSEEK_API_KEY` is set; degraded fallback otherwise
- **Admin**: `/vi/admin` reindex + audit log (`role=admin`)
- **Mobile web**: responsive navbar, promo carousel, touch targets
- **Containers**: multi-service Docker Compose · **Docker Hub** + **GitHub Packages (GHCR)** · tagged **Releases**

> [!NOTE]
> Booking payment là **mock** (không PSP). Transport browse-only. Không tích hợp Traveloka partner APIs.

---

## Architecture

```mermaid
flowchart LR
  Browser --> Web[web]
  Web --> Identity[identity]
  Web --> API[api]
  Web --> AI[ai]
  API --> PG[(postgres)]
  API --> Redis[(redis)]
  API --> Meili[(meilisearch)]
  Identity --> PG
  AI --> ChatWebhook[chat-webhook / n8n]
  ChatWebhook --> DeepSeek[DeepSeek API]
```

| Service | Path | Host port (local overlay) | GHCR | Docker Hub |
|---------|------|---------------------------|------|------------|
| web | [`web/`](web/README.md) | **53000** | `ghcr.io/jasontm17/travelai-web` | `nguyenson1710/travelai-web` |
| api | [`api/`](api/README.md) | **53001** | `ghcr.io/jasontm17/travelai-api` | `nguyenson1710/travelai-api` |
| identity | [`identity/`](identity/README.md) | **53002** | `ghcr.io/jasontm17/travelai-identity` | `nguyenson1710/travelai-identity` |
| ai | [`ai/`](ai/README.md) | **53003** | `ghcr.io/jasontm17/travelai-ai` | `nguyenson1710/travelai-ai` |

Contract: [`docs/openapi.yaml`](docs/openapi.yaml) · Architecture: [`docs/system-architecture.md`](docs/system-architecture.md) · ADRs: [`docs/adr/`](docs/adr/) · Docs index: [`docs/README.md`](docs/README.md)

> SSR inside Docker uses `API_INTERNAL_URL=http://api:3001` while the browser uses `NEXT_PUBLIC_*` host ports.

---

## Quick start

```bash
git clone https://github.com/JasonTM17/VN_TravelAI.git
cd VN_TravelAI
cp .env.example .env

# Remapped ports (avoids FoodFlow / other stacks on 3000–3003)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

| URL | Service |
|-----|---------|
| http://localhost:53000 | Web (default locale `vi`) |
| http://localhost:53001/healthz | API |
| http://localhost:53002/healthz | Identity |
| http://localhost:53003/healthz | AI |

**Demo user** (local only — see `.env.example`; requires `SEED_DEMO_USER=true`):

- Email: `demo@travelai.local`
- Password: `DemoTravelAI1!`
- Role: **admin** (local seed)

```bash
# Smoke
./scripts/smoke.ps1
# Live chat (optional DeepSeek key in .env)
node scripts/smoke-chat.mjs
```

Native (không Docker full stack): xem [`docs/getting-started/local-setup.md`](docs/getting-started/local-setup.md).

### DeepSeek live chat

```env
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --force-recreate chat-webhook ai
# or
./scripts/reload-deepseek-chat.ps1
```

Chi tiết AI: [`docs/ai/deepseek-chatbot.md`](docs/ai/deepseek-chatbot.md).

---

## AI & DeepSeek

| Capability | Status |
|------------|--------|
| Chat Completions via webhook + HMAC | COMPLETE path |
| Model default `deepseek-v4-flash` | COMPLETE config |
| Degraded fallback without key | COMPLETE |
| Streaming / RAG / tool-calling / chat DB | NOT IMPLEMENTED |

---

## Security (tóm tắt)

- Production JWT: Ed25519 PEM **fail-closed** · dual JWKS  
- CORS allowlist · Meili filter sanitize · inbound HMAC **raw body**  
- Demo admin seed **gated** (`SEED_DEMO_USER`)  
- Residual: tokens trong `localStorage`; metrics public; mock pay  

Chi tiết: [`docs/security/overview.md`](docs/security/overview.md) · [`SECURITY.md`](SECURITY.md)

---

## Testing

```bash
# Unit (mỗi service)
cd identity && node ./node_modules/vitest/vitest.mjs run
# OpenAPI
npx --yes @redocly/cli@1 lint docs/openapi.yaml --config redocly.yaml
# E2E local (stack up)
cd e2e && pnpm test
```

CI: unit hard-fail · lint advisory · e2e khi `E2E_ENABLED=true`.  
Xem [`docs/testing/overview.md`](docs/testing/overview.md).

---

## Releases & packages

| Surface | Where |
|---------|--------|
| **Releases** | [github.com/JasonTM17/VN_TravelAI/releases](https://github.com/JasonTM17/VN_TravelAI/releases) — created by `.github/workflows/release.yml` on `v*` tags |
| **Packages (GHCR)** | Repo → Packages, or `ghcr.io/jasontm17/travelai-{web,api,identity,ai}` |
| **Docker Hub** | `nguyenson1710/travelai-*` (needs repo secrets `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN`) |

```bash
# GitHub Container Registry (shows under repo Packages)
docker pull ghcr.io/jasontm17/travelai-web:latest
docker pull ghcr.io/jasontm17/travelai-api:latest
docker pull ghcr.io/jasontm17/travelai-identity:latest
docker pull ghcr.io/jasontm17/travelai-ai:latest
```

Publish flow: push `main` → `docker-publish` builds/pushes Hub + GHCR · tag `v0.1.0` or Actions → **release** workflow creates GitHub Release.

---

## Documentation

| Doc | Mô tả |
|-----|--------|
| [docs/README.md](docs/README.md) | Index đầy đủ |
| [Getting started](docs/getting-started/local-setup.md) | Docker + native |
| [Environment variables](docs/getting-started/environment-variables.md) | Inventory (no secrets) |
| [System architecture](docs/system-architecture.md) | Service map |
| [API overview](docs/api/overview.md) | HTTP inventory |
| [Database](docs/database/overview.md) | Prisma models |
| [Docker](docs/docker/overview.md) | Compose & images |
| [Deployment](docs/deployment-guide.md) | Local / prod-like |
| [Troubleshooting](docs/operations/troubleshooting.md) | Runbook dev |
| [Scout report](docs/reports/vietnam-travel-codebase-scout.md) | Status matrix |

---

## Repository layout

```
api/          Fastify catalog, booking, promos, admin reindex
identity/     Auth, JWKS, demo admin user (gated)
ai/           Chat/itinerary orchestrator → HMAC webhook
web/          Next.js 15 App Router UI
infra/n8n/    Workflow JSON (travel-chat → DeepSeek)
docs/         OpenAPI, ADRs, media screenshots, guides
scripts/      Smoke, image audit, DeepSeek helpers
.stitch/      Design system exports (may be gitignored)
```

---

## Known limitations / Non-goals (MVP)

| Item | Status |
|------|--------|
| Real PSP settlement | NOT IMPLEMENTED (mock pay only) |
| Inventory / overselling control | NOT IMPLEMENTED |
| Live airline GDS / multi-vendor PMS | OUT_OF_SCOPE |
| Native Flutter apps | OUT_OF_SCOPE |
| Traveloka partner integration | OUT_OF_SCOPE |
| RAG / tool-calling | NOT IMPLEMENTED |
| Always-on CI e2e | PARTIAL (`E2E_ENABLED`) |

---

## Contributing

Xem [`CONTRIBUTING.md`](CONTRIBUTING.md) — Conventional Commits, không AI co-author trailer, update OpenAPI khi đổi contract.

## Security reporting

Xem [`SECURITY.md`](SECURITY.md) — không mở public issue cho vulnerability.

## License

[MIT](LICENSE) © Nguyen Tien Son
