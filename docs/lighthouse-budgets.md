# Lighthouse budgets (TravelAI web)

Target gates (CI advisory until baseline):

| Metric | Mobile | Desktop |
|--------|--------|---------|
| Performance | ≥ 80 | ≥ 90 |
| Accessibility | ≥ 90 | ≥ 90 |
| LCP | ≤ 2.5s | ≤ 2.5s |
| INP | ≤ 200ms | ≤ 200ms |
| CLS | ≤ 0.1 | ≤ 0.1 |

Bundle: initial JS ≤ 200 KB gzipped per route (monitor via Next build output).

Run manually:

```bash
npx lhci autorun --collect.url=http://localhost:3000/vi
```
