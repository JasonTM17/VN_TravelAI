# e2e

Playwright smoke tests for TravelAI critical paths.

```bash
# stack must be running (web on :3000)
pnpm install
npx playwright install chromium
pnpm test
```

Set `WEB_URL` if using compose.local port remap.
