# Local setup

**Purpose:** Chạy TravelAI trên máy dev.  
**Prerequisites:** Docker + Docker Compose, Git, (optional) Node 22 + pnpm cho native.

## 1. Docker (khuyến nghị)

```bash
git clone https://github.com/JasonTM17/VN_TravelAI.git
cd VN_TravelAI
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

| URL | Service |
|-----|---------|
| http://localhost:53000 | Web (locale mặc định `vi`) |
| http://localhost:53001/healthz | API |
| http://localhost:53002/healthz | Identity |
| http://localhost:53003/healthz | AI |

> [!IMPORTANT]
> Overlay local remap port **53000–53003** để tránh conflict stack khác trên 3000–3003.

### Demo user (local only)

Chỉ khi `SEED_DEMO_USER=true` (mặc định trong `.env.example` local):

| Field | Value (example) |
|-------|-----------------|
| Email | `demo@travelai.local` |
| Password | `DemoTravelAI1!` |
| Role | admin (seed) |

> [!WARNING]
> Không dùng demo seed / password example trên production (`SEED_DEMO_USER=false`, `RUN_SEED=false`).

### Smoke

```powershell
powershell -File scripts/smoke.ps1
# Optional DeepSeek (cần DEEPSEEK_API_KEY trong .env)
node scripts/smoke-chat.mjs
```

### DeepSeek live chat

```bash
# Set DEEPSEEK_API_KEY in .env (never commit real key)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --force-recreate chat-webhook ai
# or
powershell -File scripts/reload-deepseek-chat.ps1
```

Model default: `deepseek-v4-flash` (`DEEPSEEK_MODEL`).

## 2. Native (services riêng)

Infra tối thiểu:

```bash
docker compose up -d postgres redis meilisearch
```

Mỗi service (ví dụ api):

```bash
cd api
pnpm install
pnpm prisma:dev
pnpm seed   # catalog
pnpm dev
```

Identity: `pnpm prisma:dev` + `pnpm dev`  
AI: `pnpm dev`  
Web: set `NEXT_PUBLIC_*` → `pnpm dev` (port 3000)

Chi tiết env: [environment-variables.md](./environment-variables.md)  
Per-service: `web/README.md`, `api/README.md`, `identity/README.md`, `ai/README.md`.

## 3. Verification

1. `GET` healthz 53001–53003 → 200  
2. Mở http://localhost:53000/vi — catalog stats/promos  
3. Login demo → bookings list  
4. Chat widget: reply live hoặc `degraded: true`  

## 4. Related

- [Docker overview](../docker/overview.md)
- [Troubleshooting](../operations/troubleshooting.md)
