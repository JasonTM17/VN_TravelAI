# Deployment guide

**Purpose:** Local, image publish, và compose prod-like.  
**Production cloud target:** UNKNOWN (không chọn AWS/Vercel/K8s trong docs).  
**Last verified:** `e715b96`

## Mục lục

1. Local development  
2. Production compose  
3. Images & registries  
4. Environment checklist  
5. E2E  
6. Backup / restore  
7. Rollback  
8. Related docs  

## Local (development)

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
# Web http://localhost:53000  API :53001  Identity :53002  AI :53003
powershell -File scripts/smoke.ps1
```

Local enables `SEED_DEMO_USER=true`, `RUN_SEED=true`, `NEXT_PUBLIC_DEMO_PREFILL=true`, DeepSeek via `chat-webhook` when `DEEPSEEK_API_KEY` is set.

Chi tiết: [getting-started/local-setup.md](./getting-started/local-setup.md).

## Production compose

```bash
# Set secrets: IDENTITY_JWT_PRIMARY_PRIVATE_KEY, DB passwords, MEILI_MASTER_KEY, REDIS_PASSWORD, N8N_HMAC_SECRET
export SEED_DEMO_USER=false RUN_SEED=false NODE_ENV=production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Prod overlay:

- Pulls `nguyenson1710/travelai-*` (or rebuild GHCR `ghcr.io/jasontm17/travelai-*`)
- Unpublishes Postgres/Redis/Meili host ports
- Disables demo seed; requires JWT PEMs (`JWT_REQUIRE_PEM` / `NODE_ENV=production`)
- MinIO only with profile `storage` (app does not use MinIO today)

## Images

| Registry | Names | Workflow |
|----------|--------|----------|
| Docker Hub | `nguyenson1710/travelai-{web,api,identity,ai}` | `.github/workflows/docker-publish.yml` |
| GHCR | `ghcr.io/jasontm17/travelai-{web,api,identity,ai}` | same |
| GitHub Releases | tag `v*` | `.github/workflows/release.yml` |

Dockerfiles use `pnpm install --frozen-lockfile`. Web `NEXT_PUBLIC_*` is bake-time — rebuild web image per environment with correct public URLs / `NEXT_PUBLIC_CSP_CONNECT_SRC`.

```bash
docker pull ghcr.io/jasontm17/travelai-web:latest
docker pull ghcr.io/jasontm17/travelai-api:latest
docker pull ghcr.io/jasontm17/travelai-identity:latest
docker pull ghcr.io/jasontm17/travelai-ai:latest
```

## Environment checklist (prod)

| Item | Required |
|------|----------|
| JWT primary PEM | yes |
| Strong DB/Meili/Redis/HMAC secrets | yes |
| `SEED_DEMO_USER=false` `RUN_SEED=false` | yes |
| `CORS_ORIGINS` = real web origins | yes |
| Public `NEXT_PUBLIC_*` match deploy host | yes (rebuild web) |

Full matrix: [environment-variables.md](./getting-started/environment-variables.md).

## E2E

Local: stack up then `cd e2e && pnpm test`.  
CI: set GitHub repo variable `E2E_ENABLED=true` to enable `.github/workflows/e2e.yml`:

```bash
gh variable set E2E_ENABLED --body "true"
# requires Actions billing / runner minutes available
```

## Cookie (identity refresh)

| Variable | Purpose |
|----------|---------|
| `COOKIE_DOMAIN` | Optional e.g. `.example.com` for multi-subdomain; empty = host-only |
| `COOKIE_SAMESITE` | `Lax` \| `None` \| `Strict`; empty = auto (`None` in production) |

Local multi-port compose: leave `COOKIE_DOMAIN` empty.

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
- Verify `/healthz` + smoke after rollback
- Schema down-migrations: **not** assumed automatic — restore DB backup if needed

## Related

- [Docker overview](./docker/overview.md)
- [Operations runbook](./operations/runbook.md)
- [Security overview](./security/overview.md)
