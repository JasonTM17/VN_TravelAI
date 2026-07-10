# Contributing to TravelAI

Cảm ơn bạn quan tâm đóng góp. Repo được maintain bởi sole primary author; PR bên ngoài được chào đón.

## Prerequisites

- Git, Docker + Docker Compose  
- Node 22+ và pnpm (khi chạy native)  
- Đọc [docs/getting-started/local-setup.md](docs/getting-started/local-setup.md)

## Development setup

### Docker (khuyến nghị)

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

### Native

1. Copy `.env.example` → `.env`.
2. Start infra: `docker compose up -d postgres redis meilisearch`.
3. Chạy từng service theo `web|api|identity|ai/README.md`.
4. Dùng **pnpm** cho từng service (không có root workspace).

## Coding standards

- TypeScript strict.
- Validate body mutating bằng Zod `safeParse`.
- Mỗi service expose `/healthz`, `/readyz`, `/metrics`.
- Không commit `.env`, PEM, token, password thật.
- Không thêm AI co-author trailer trong commit.
- Chi tiết: [docs/code-standards.md](docs/code-standards.md).

## Lint / type / test

```bash
# Unit (trong thư mục service)
node ./node_modules/vitest/vitest.mjs run
# OpenAPI
npx --yes @redocly/cli@1 lint docs/openapi.yaml --config redocly.yaml
# E2E (stack local up)
cd e2e && pnpm test
```

CI: unit + build hard-fail; lint có thể advisory (`continue-on-error`).

## Database migrations

- Prisma migrations trong `api/prisma/migrations` và `identity/prisma/migrations`.
- Docker entrypoint: `prisma migrate deploy` (hard-fail).
- Seed catalog: `RUN_SEED=true` (local only).
- Không chạy destructive migration trên shared/prod DB từ PR.

## Search index

- Sau seed lớn: admin reindex hoặc đợi boot reindex.
- Filter values phải đi qua sanitize helper (không nối string thô).

## AI changes

- Giữ boundary HMAC webhook (ADR-0004).
- Không commit `DEEPSEEK_API_KEY` / embedding / Pinecone secrets.
- Test helper: `scripts/lib/deepseek-travel-chat.test.mjs`.
- Tool-calling chỉ read-only catalog; không thêm tool mutate booking/pay.
- RAG: Meili + `/v1/search/vectors` — cập nhật `docs/ai/deepseek-chatbot.md` khi đổi.

## Documentation

- Cập nhật docs liên quan khi đổi behavior user-facing.
- Media README: không xóa asset đang được root README reference.
- Index: [docs/README.md](docs/README.md).

## Commit messages

Dùng [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(api): add hotel search filters
fix(identity): rotate refresh tokens on reuse
docs(readme): document demo credentials
```

- Subject ≤ 72 characters, imperative mood, no trailing period.
- Do **not** add AI co-author trailers (`Co-Authored-By: Claude`, etc.).

**Existing convention:** Conventional Commits (đã dùng trong history).  
**Recommended:** giữ nguyên; scope = service name (`web`, `api`, `identity`, `ai`, `ci`, `docs`).

## Pull requests

1. Branch from `main`: `feat/...`, `fix/...`, `docs/...`.
2. Keep PRs focused (one logical change cluster).
3. CI must pass: build, test, (lint advisory), security scans when configured.
4. Update OpenAPI when changing public HTTP contracts.
5. Add or update ADR under `docs/adr/` for architecture decisions.

## Pull-request checklist

- [ ] Tests added/updated for behavior change  
- [ ] No secrets in diff  
- [ ] OpenAPI synced if HTTP contract changed  
- [ ] Docs touched if user-facing / ops behavior changed  
- [ ] Demo/screenshots still accurate if UI changed  

## Security expectations

- Never commit `.env`, keys, tokens, or real credentials.
- Report vulnerabilities privately (see `SECURITY.md`).
- Prefer fail-closed for auth secrets in production paths.

## Definition of Done

1. Behavior works on local Docker overlay (53000–53003) hoặc documented native path.  
2. Relevant unit tests pass.  
3. No new CRITICAL security footgun (CORS open, PEM ephemeral prod, etc.).  
4. Docs/README links still resolve.  

## Related

- [docs/code-standards.md](docs/code-standards.md)
- [docs/security/overview.md](docs/security/overview.md)
