# e2e

Playwright smoke tests for TravelAI critical paths (Vietnam Travel / TravelAI marketplace).

## Local (required)

```bash
# stack must be running — compose.local ports
# docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
pnpm install
npx playwright install chromium
# WEB_URL default: http://127.0.0.1:53000 (see playwright.config.ts)
pnpm test
```

## CI

Workflow `.github/workflows/e2e.yml` runs only when repository variable **`E2E_ENABLED=true`**
(Actions billing / runner quota may block compose jobs otherwise).

Without that variable, the workflow job `e2e-status` still documents the skip so CI stays green.

## Suites

| Spec | Coverage |
|------|----------|
| `smoke.spec.ts` | locale home, core routes |
| `booking-happy.spec.ts` | login → hotel → book → optional mock pay |
| `auth-register-change-password.spec.ts` | register + change password |
| `gestures-a2z.spec.ts` | broader UI gestures |

Set `PLAYWRIGHT_BASE_URL` or `WEB_URL` if not using 53000.
