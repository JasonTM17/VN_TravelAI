# Testing overview

**Last verified:** `9f4d424`

## 1. Pyramid

| Layer | Tool | Location | CI |
|-------|------|----------|-----|
| Unit | Vitest | `identity|api|ai|web` `src/**/*.test.ts` | hard-fail on `pnpm test` |
| Contract | Redocly | `docs/openapi.yaml` | job `openapi` |
| E2E | Playwright | `e2e/tests/*.spec.ts` | gated `E2E_ENABLED` |
| Scripts | node test / smoke | `scripts/` | local |

## 2. Run locally

```bash
# Per service (if pnpm install blocked by ignored builds, use node vitest):
cd identity && node ./node_modules/vitest/vitest.mjs run
cd api && node ./node_modules/vitest/vitest.mjs run
cd ai && node ./node_modules/vitest/vitest.mjs run
cd web && node ./node_modules/vitest/vitest.mjs run

# OpenAPI
npx --yes @redocly/cli@1 lint docs/openapi.yaml --config redocly.yaml

# E2E (stack up on 53000+)
cd e2e && pnpm test
```

## 3. Notable unit suites

| Area | File |
|------|------|
| JWT keys fail-closed | `identity/src/lib/keys.test.ts` |
| Booking transitions | `api/src/lib/booking-state.test.ts` |
| Meili sanitize | `api/src/lib/meili-filter.test.ts` |
| HMAC | `ai/src/lib/hmac.test.ts` |
| Auth storage | `web/src/lib/auth-storage.test.ts` |
| DeepSeek helpers | `scripts/lib/deepseek-travel-chat.test.mjs` |

## 4. Gaps (honest)

- Full HTTP inject integration suite limited  
- Concurrency/overselling tests N/A until inventory  
- E2E not always-on in CI  
- Lint still advisory in CI  

## 5. Related

- [CI workflows](../../.github/workflows/)
- [Lighthouse budgets](../lighthouse-budgets.md)
