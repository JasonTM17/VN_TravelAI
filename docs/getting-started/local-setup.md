# Local setup

**Purpose:** Chạy TravelAI trên máy dev.  
**Prerequisites:** Docker + Docker Compose, Git, (optional) Node 22 + pnpm cho native.
**Last verified:** `a796b94` (2026-07-11).

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
| localhost:55432 | PostgreSQL |
| localhost:56379 | Redis |
| http://localhost:57700 | Meilisearch |
| http://localhost:55678 | Local chat-webhook |
| http://localhost:55679 | n8n UI (when started) |

> [!IMPORTANT]
> Overlay local remap app ports **53000–53003** và infra ports ở bảng trên. Profile `storage` thêm MinIO `59000/59001`.

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

Native processes cannot use Docker DNS names. Override database/Redis/Meili/JWKS URLs to `localhost` host ports before `pnpm dev`; run Prisma migration/generation for both API and identity. Root `.env` values using `postgres`, `redis`, or `meilisearch` are intended for containers.

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
