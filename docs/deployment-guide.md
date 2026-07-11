# Deployment guide

**Purpose:** Local, image publish, và compose prod-like.  
**Production cloud target:** UNKNOWN (không chọn AWS/Vercel/K8s trong docs).  
**Last verified:** `a796b94` (2026-07-11)

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
export IMAGE_TAG=sha-<full-git-commit-sha>
export REDIS_PASSWORD=<strong-url-safe-random-password>
export SEED_DEMO_USER=false RUN_SEED=false NODE_ENV=production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Tạo secret env riêng ngoài Git, rồi kiểm tra interpolation bằng `docker compose --env-file <secure-env-file> -f docker-compose.yml -f docker-compose.prod.yml config`. Không dùng `.env.production.example` nguyên trạng.

Prod overlay:

- Pulls `nguyenson1710/travelai-*` (or rebuild GHCR `ghcr.io/jasontm17/travelai-*`)
- Unpublishes Postgres/Redis/Meili host ports
- Disables demo seed; requires JWT PEMs (`JWT_REQUIRE_PEM` / `NODE_ENV=production`)
- Requires immutable `IMAGE_TAG` and authenticated Redis connections
- MinIO only with profile `storage` (app does not use MinIO today)
- Base Compose không tự import/activate workflow n8n. Muốn dùng n8n thật phải import `infra/n8n/workflows/travel-chat.json`, activate webhook, cấp `N8N_HMAC_SECRET` và `DEEPSEEK_*` cho n8n, rồi kiểm tra `/webhook/travel-chat`. Nếu chưa làm, chat non-stream chỉ degraded/failover.

> [!CAUTION]
> Một số optional service env chưa được forward qua Compose: cookie controls, metrics/admin token, SMTP keys và một số `NEXT_PUBLIC_*`. Embedding/Pinecone và AI direct DeepSeek keys are forwarded. Đặt biến khác trong `.env` chưa có nghĩa container nhận được; luôn kiểm tra `docker compose config`.

## Images

| Registry | Names | Workflow |
|----------|--------|----------|
| Docker Hub | `nguyenson1710/travelai-{web,api,identity,ai}` | `.github/workflows/docker-publish.yml` |
| GHCR | `ghcr.io/jasontm17/travelai-{web,api,identity,ai}` | private; verified `latest` + SHA tags |
| GitHub Releases | tag `v*`; latest verified `v0.2.0` | `.github/workflows/release.yml` |

Dockerfiles use `pnpm install --frozen-lockfile`. Web `NEXT_PUBLIC_*` is bake-time — rebuild web image per environment with correct public URLs / `NEXT_PUBLIC_CSP_CONNECT_SRC`.

```bash
docker pull ghcr.io/jasontm17/travelai-web:sha-<full-git-commit-sha>
```

Authenticate before pulling private GHCR packages: `echo "<package-read-token>" | docker login ghcr.io -u <github-user> --password-stdin`. Release `v0.2.0` currently has no matching semver image tags; deploy the immutable SHA tag.

## Environment checklist (prod)

| Item | Required |
|------|----------|
| JWT primary PEM | yes |
| Strong DB/Meili/Redis/HMAC secrets | yes |
| Immutable `IMAGE_TAG` (`sha-<full SHA>` currently) | yes |
| `SEED_DEMO_USER=false` `RUN_SEED=false` | yes |
| `CORS_ORIGINS` = real web origins | yes |
| Public `NEXT_PUBLIC_*` match deploy host | yes (rebuild web) |

Full matrix: [environment-variables.md](./getting-started/environment-variables.md).

## E2E

Local: stack up then `cd e2e && pnpm test`. CI runs every Playwright spec and fails when stack health or any spec fails.

## Cookie (identity refresh)

| Variable | Purpose |
|----------|---------|
| `COOKIE_DOMAIN` | Optional e.g. `.example.com` for multi-subdomain; empty = host-only |
| `COOKIE_SAMESITE` | `Lax` \| `None` \| `Strict`; empty = auto (`None` in production) |

Local multi-port compose: leave `COOKIE_DOMAIN` empty.

Current Compose does not forward these cookie variables to identity. They apply only to native/service-level runs until Compose wiring is added.

## Backup / restore (Postgres)

```bash
docker exec travelai-postgres pg_dump -U travelai travelai > backup-catalog.sql
docker exec travelai-postgres pg_dump -U travelai travelai_identity > backup-identity.sql
# restore:
cat backup-catalog.sql | docker exec -i travelai-postgres psql -U travelai travelai
cat backup-identity.sql | docker exec -i travelai-postgres psql -U travelai travelai_identity
```

Stop writers or use a maintenance window, encrypt and retain backups outside the host, restore both databases, then verify migrations/auth/catalog. After restore, run Meili reindex as admin (`POST /v1/admin/reindex`).

## Rollback

- Pin previous image tag / git SHA on compose `IMAGE_TAG`
- Do not auto-run destructive seed in prod
- Verify `/healthz` + smoke after rollback
- Schema down-migrations: **not** assumed automatic — restore DB backup if needed

## Related

- [Docker overview](./docker/overview.md)
- [Operations runbook](./operations/runbook.md)
- [Security overview](./security/overview.md)
