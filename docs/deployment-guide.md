# Deployment guide

## Local (development)

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
# Web http://localhost:53000  API :53001  Identity :53002  AI :53003
powershell -File scripts/smoke.ps1
```

Local enables `SEED_DEMO_USER=true`, `RUN_SEED=true`, `NEXT_PUBLIC_DEMO_PREFILL=true`, DeepSeek via `chat-webhook` when `DEEPSEEK_API_KEY` is set.

## Production compose

```bash
# Set secrets: IDENTITY_JWT_PRIMARY_PRIVATE_KEY, DB passwords, MEILI_MASTER_KEY, REDIS_PASSWORD, N8N_HMAC_SECRET
export SEED_DEMO_USER=false RUN_SEED=false NODE_ENV=production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Prod overlay:

- Pulls `nguyenson1710/travelai-*` (or rebuild GHCR `ghcr.io/jasontm17/travelai-*`)
- Unpublishes Postgres/Redis/Meili host ports
- Disables demo seed; requires JWT PEMs (`JWT_REQUIRE_PEM`)
- MinIO only with profile `storage` (app does not use MinIO today)

## Images

| Registry | Names |
|----------|--------|
| Docker Hub | `nguyenson1710/travelai-{web,api,identity,ai}` |
| GHCR | `ghcr.io/jasontm17/travelai-{web,api,identity,ai}` |

Web `NEXT_PUBLIC_*` is bake-time. Rebuild web image per environment with correct public URLs / `NEXT_PUBLIC_CSP_CONNECT_SRC`.

## Backup / restore (Postgres)

```bash
docker exec travelai-postgres pg_dump -U travelai travelai > backup-catalog.sql
docker exec travelai-postgres pg_dump -U travelai travelai_identity > backup-identity.sql
# restore:
cat backup-catalog.sql | docker exec -i travelai-postgres psql -U travelai travelai
```

After restore, run Meili reindex as admin (`POST /v1/admin/reindex`).

## Rollback

- Pin previous image tag / git SHA on compose `IMAGE_TAG`
- Do not auto-run destructive seed in prod
