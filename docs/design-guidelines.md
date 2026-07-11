# Design guidelines — TravelAI UI

**Purpose:** Ngôn ngữ UI quan sát được từ `web/` (không regenerate design binary).  
**Last verified:** `a796b94` (2026-07-11)

## 1. Platform

| Item | Value |
|------|-------|
| Framework | Next.js 15.5.18 App Router |
| Styling | Tailwind CSS 4 |
| Locales | `vi` (default), `en` |
| Layout shell | Navbar + footer + chatbot FAB |
| Media assets | `docs/media/` (product shots) |

## 2. Structure

- Routes under `web/src/app/[locale]/…`
- Shared components: `web/src/components/`
- Copy: `web/src/lib/i18n.ts` (VI/EN parallel keys)
- Status badges: `web/src/components/ui/status-badge.tsx`

## 3. Visual patterns (observed)

| Pattern | Usage |
|---------|-------|
| Brand colors | `ocean`, `coral`, `rice` utility classes in components |
| CTA | rounded-full buttons, `shadow-glow` on primary actions |
| Cards | hover lift on catalog cards (where applied) |
| Chatbot | floating widget global |
| Admin | non-indexable metadata (`robots: noindex`) |

## 4. Accessibility & responsive

- Mobile screenshots: `docs/media/09-mobile-home.png`, `10-mobile-gallery.png`
- Responsive/touch intent is evidenced by components and screenshots; WCAG/accessibility conformance has not been audited end-to-end
- CSP + security headers in `next.config.ts`
- Prefer bilingual strings from i18n; avoid hard-coded EN-only in new UI
- Require visible `focus-visible`, accessible labels, keyboard operation, reduced motion and tested empty/error/loading states for new interactions

## 5. SEO

| Asset | Path |
|-------|------|
| Locale metadata | `generateMetadata` on list/detail pages |
| Sitemap | `web/src/app/sitemap.ts` |
| Robots | `web/src/app/robots.ts` |
| Not found | `web/src/app/[locale]/not-found.tsx` |

## 6. Content rules for contributors

1. Không hard-code secret trong UI.
2. Empty/error states: reuse existing components where present.
3. Prices: VND from API (`priceFromVnd` / `priceVnd`) — format consistently.
4. Screenshots for README: capture from **seeded** success UI only (global rule).

## 7. Related

- [web/README](../web/README.md)
- [Media README](./media/README.md)
- ADR [0005 i18n](./adr/0005-i18n-locale-routes.md)
