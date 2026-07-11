# Code standards — TravelAI

**Purpose:** Chuẩn code đã quan sát trong repo + convention contributor.  
**Last verified:** `a796b94` (2026-07-11)

## 1. Ngôn ngữ & toolchain

| Rule | Evidence |
|------|----------|
| TypeScript strict per service | `*/tsconfig.json` |
| Node ≥ 22 (api/identity/ai) | `engines` in package.json |
| pnpm + frozen lockfile in Docker | `*/Dockerfile` |
| ESLint present; CI lint hard-fail | `.github/workflows/ci.yml` |
| Vitest unit tests | `*.test.ts` |

## 2. Architecture rules (project)

1. **Service split** — FE không dùng Next API routes làm production backend chính (ADR-0002).
2. **Responsibility naming** — `web`, `api`, `identity`, `ai` (không gắn ngôn ngữ vào tên).
3. **Auth** — Ed25519 JWT + JWKS; refresh opaque hashed + httpOnly cookie (ADR-0006).
4. **AI boundary** — LLM qua n8n/HMAC webhook; tools read-only; RAG via api public catalog (ADR-0004).
5. **Contract** — OpenAPI `docs/openapi.yaml`; FE generate client (`web` script `generate:api`); runtime still primarily `web/src/lib/api.ts` (PARTIAL dual client).

## 3. API conventions

- Prefix `/v1/`
- Validation Zod `safeParse` trên body mutating
- Problem-style errors trên mutating paths (`sendProblem` api)
- Health: `/healthz`, `/readyz`, `/metrics`
- Correlation: `x-request-id` (identity/api/ai)
- Booking create: `Idempotency-Key` required; hotel optional `roomTypeId` / `ratePlanId`

## 4. Frontend conventions

- App Router locale segment `[locale]` (`vi` | `en`)
- Client components cho auth/booking/chat (`"use client"`)
- i18n dictionary `web/src/lib/i18n.ts`
- CSP headers trong `web/next.config.ts`
- Access token: memory default; refresh cookie only (`auth-storage.ts`)

## 5. Database

- Prisma migrations checked in under `*/prisma/migrations`
- Catalog seed: `api/prisma/seed.ts` (gated `RUN_SEED`) includes PMS room types/rate plans
- Demo user seed: identity `SEED_DEMO_USER`

## 6. Git / PR (existing CONTRIBUTING)

- Conventional Commits: `feat|fix|docs|refactor|test|ci|build|chore|...`
- **Không** `Co-Authored-By: Claude` / AI trailers
- Branch từ `main`: `feat/…`, `fix/…`, `docs/…`
- Update OpenAPI khi đổi HTTP public contract
- ADR mới khi đổi kiến trúc

## 7. Secrets

- Không commit `.env`
- Chỉ placeholder trong `.env.example` / docs
- PEM JWT empty → ephemeral **dev only**; production fail-closed
- SMTP / embedding / Pinecone keys never logged

## 8. Testing expectations

| Surface | Command (host) | Note |
|---------|----------------|------|
| Unit | `node ./node_modules/vitest/vitest.mjs run` trong service dir | pnpm may block install scripts locally |
| E2E | stack up → `cd e2e && pnpm test` | CI runs all specs; failures block |
| OpenAPI | `npx @redocly/cli@1 lint docs/openapi.yaml --config redocly.yaml` | |

## 9. Related

- [CONTRIBUTING](../CONTRIBUTING.md)
- [Security overview](./security/overview.md)
