# Docker & CI/CD supply-chain audit — TravelAI

**HEAD:** `b49481d` · **Date:** 2026-07-10

---

## 1. Packages UI empty — root cause analysis

**User observation:** GitHub → Packages → “No packages published”.

| Hypothesis | Result | Evidence |
|------------|--------|----------|
| No workflow | REJECTED | `.github/workflows/docker-publish.yml` |
| Wrong image names | REJECTED | matrix `ghcr.io/jasontm17/travelai-{web,api,identity,ai}` |
| Missing packages:write | REJECTED | `permissions.packages: write` |
| Actions never execute jobs | **CONFIRMED** | Run annotation: account payments failed / spending limit |
| DOCKERHUB secrets wrong | UNKNOWN | Hub login `continue-on-error: true` may hide; GHCR should still work if runners start |

**Conclusion:** Empty Packages is an **ops/billing** failure, not missing application code.  
**This audit pass does not publish images** (hard boundary + billing).

### Remediaton steps (maintainer)

1. GitHub → Settings → Billing & plans → fix payment / raise spending limit.  
2. Confirm secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (for Hub).  
3. `gh workflow run docker-publish.yml`  
4. Verify: repo Packages + `docker pull ghcr.io/jasontm17/travelai-web:latest`  
5. Optional local push after `docker login` (user machine).

---

## 2. Compose architecture

| File | Role |
|------|------|
| docker-compose.yml | Full stack + host ports for data plane |
| docker-compose.local.yml | Ports 53000–53003, SEED demo, chat-webhook |
| docker-compose.prod.yml | Image pull, seed off, data ports locked |

Services: postgres, redis, meilisearch, minio, n8n, identity, api, ai, web (+ chat-webhook local).

---

## 3. Dockerfile posture

| Control | Status |
|---------|--------|
| Multi-stage | COMPLETE (4 services) |
| frozen-lockfile | COMPLETE |
| Non-root 65532 | COMPLETE |
| HEALTHCHECK | COMPLETE |
| Secrets in image | Avoid — runtime env |

---

## 4. CI workflows

| Workflow | Purpose | Status |
|----------|---------|--------|
| ci.yml | lint/test/build hard-fail | Code OK; runners need billing |
| e2e.yml | Playwright | Gated `E2E_ENABLED=true` (set); runners need billing |
| docker-publish.yml | Hub+GHCR | Blocked by billing |
| release.yml | GitHub Release on tags | Untested this pass |
| codeql, trivy, gitleaks | Security scans | Present |

**Supply chain notes:**

- Hub login `continue-on-error: true` (`docker-publish.yml`) → may push GHCR only if Hub fails; currently **neither** if no runner.  
- Third-party actions pinned to major tags (v3/v4/v5/v6) — residual supply risk if tags move.

---

## 5. Container risks

| Risk | Sev | Notes |
|------|-----|-------|
| Public DB/Redis/Meili ports base compose | Medium | OK local; use prod overlay |
| MinIO unused | Medium | Extra surface |
| SEED_DEMO_USER true default base | Medium | Local; prod overlay false |
| No image SBOM in workflow | Low | Optional improvement |

---

## 6. Verification commands (safe)

```powershell
gh run list --workflow=docker-publish.yml --limit 5
# after billing fixed:
gh workflow run docker-publish.yml
gh api user/packages --jq '.[].name'
```

Do **not** print secret values.
