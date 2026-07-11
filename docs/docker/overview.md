# Docker overview

**Last verified:** `a796b94` (2026-07-11)

## 1. Compose files

| File | Role |
|------|------|
| `docker-compose.yml` | Full stack definitions |
| `docker-compose.local.yml` | Ports 53000–53003, chat-webhook, demo-friendly flags |
| `docker-compose.prod.yml` | Image pull, lock down data-plane ports, prod seed off |

## 2. Application Dockerfiles

| Service | Multi-stage | Non-root | HEALTHCHECK | frozen-lockfile |
|---------|-------------|----------|-------------|-----------------|
| web | yes | 65532 | yes | yes |
| api | yes | 65532 | yes | yes |
| identity | yes | 65532 | yes | yes |
| ai | yes (distroless-style) | 65532 | yes | yes |

Entrypoints:

- `api/docker-entrypoint.sh` — `prisma migrate deploy` hard-fail; seed if `RUN_SEED=true`  
- `identity/docker-entrypoint.sh` — migrate hard-fail  

## 3. Local workflow

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

## 4. Production-like

```bash
# secrets via env / secret manager — never bake into image
export IMAGE_TAG=sha-<full-git-commit-sha>
export REDIS_PASSWORD=<strong-url-safe-random-password>
export SEED_DEMO_USER=false RUN_SEED=false NODE_ENV=production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Web `NEXT_PUBLIC_*` is **build-time** — rebuild web image per environment.

## 5. Registry matrix

| Registry | Image | Tags | Workflow | Auth | Status |
|----------|-------|------|----------|------|--------|
| Docker Hub | `nguyenson1710/travelai-*` | latest, SHA | `docker-publish.yml` | `DOCKERHUB_USERNAME`/`TOKEN` secrets | CONFIRMED workflow |
| GHCR | `ghcr.io/jasontm17/travelai-*` | latest, SHA | same | `GITHUB_TOKEN` + package Actions access | VERIFIED private packages |

```bash
docker pull ghcr.io/jasontm17/travelai-web:sha-<full-git-commit-sha>
```

Verified at `a796b94`: all four GHCR packages contain `latest` and the full SHA tag. The publish job validates same-commit CI, Trivy, CodeQL and Gitleaks after E2E succeeds. Although metadata supports semver on tag events, the current `workflow_run` path produced no `v0.2.0` image tag.

## 6. Security posture

| Control | Status |
|---------|--------|
| Non-root USER | COMPLETE |
| Secrets in image layers | Avoid — use env at runtime |
| Privileged / docker.sock | Not used in compose (CONFIRMED intent) |
| Data plane host ports | Published in base (local OK); prod overlay restricts |
| MinIO | Profile `storage` only (not default stack); app unused |

## 7. Related

- [Deployment guide](../deployment-guide.md)
- [Runbook](../operations/runbook.md)
