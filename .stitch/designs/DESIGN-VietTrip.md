---
name: VietTrip AI Design System
colors:
  surface: '#0e141a'
  surface-dim: '#0e141a'
  surface-bright: '#333a40'
  surface-container-lowest: '#080f14'
  surface-container-low: '#161c22'
  surface-container: '#1a2026'
  surface-container-high: '#242b31'
  surface-container-highest: '#2f353c'
  on-surface: '#dde3eb'
  on-surface-variant: '#bcc9c6'
  inverse-surface: '#dde3eb'
  inverse-on-surface: '#2b3137'
  outline: '#879391'
  outline-variant: '#3d4947'
  surface-tint: '#6bd8cb'
  primary: '#6bd8cb'
  on-primary: '#003732'
  primary-container: '#29a195'
  on-primary-container: '#00302b'
  inverse-primary: '#006a61'
  secondary: '#ffb77d'
  on-secondary: '#4d2600'
  secondary-container: '#d97707'
  on-secondary-container: '#432100'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#8691a7'
  on-tertiary-container: '#1f2a3c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#0e141a'
  on-background: '#dde3eb'
  surface-variant: '#2f353c'
typography:
  display-lg:
    fontFamily: Fira Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Fira Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Fira Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Fira Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Fira Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  metric-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  metric-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  target: 44px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for high-utility travel operations, prioritizing clarity and rapid data processing. The brand personality is authoritative yet calm, functioning as a "quiet co-pilot" for operators managing complex logistics. 

The aesthetic is **Dark Editorial Minimalism**. It moves away from typical consumer-facing travel apps by utilizing high-density layouts, structured information hierarchies, and a utilitarian color palette. Visual interest is derived from precision and typographic rhythm rather than decorative elements. The emotional response is one of control, reliability, and professional focus.

## Colors
The palette is rooted in a deep **Ink Navy** base to reduce eye strain during extended operational shifts. 

- **Primary (River Teal):** Reserved for primary actions and active states. It provides a cool, professional anchor.
- **CTA (Lantern Amber):** Used sparingly for high-priority alerts or "Finalize" actions that require immediate attention.
- **Surface (Muted Slate):** Utilized for card backgrounds and container layering to create subtle depth against the deep background.
- **Semantic Colors:** Coral (Warning) and Tropical Green (Success) are applied strictly to status indicators and data validation states to maintain the "practical" narrative.

## Typography
The typography system balances the humanist legibility of **Fira Sans** with the technical precision of **Geist**. 

- **Fira Sans** handles all editorial and instructional content, providing a clear, open feel even in dense layouts.
- **Geist** is used for all tabular data, booking IDs, timestamps, and pricing. Its monospaced influence ensures that columns of numbers align perfectly for quick scanning.
- **Label-caps** should be used for table headers and small metadata categories to differentiate them from interactive text.

## Layout & Spacing
This design system utilizes a **compact fluid grid** to maximize information density. The layout is optimized for a 12-column desktop view, transitioning to a single-column stack on mobile.

- **Grid:** 12 columns with 16px gutters for desktop.
- **Density:** Components use a 4px base unit. Vertical rhythm is tight to allow operators to see more data "above the fold."
- **Touch Targets:** While the layout is dense, all interactive elements (buttons, inputs) maintain a minimum height of **44px** on mobile and **32px** on desktop dashboards to ensure precision.
- **Margins:** Consistent 32px outer margins on desktop; 16px on mobile devices.

## Elevation & Depth
Depth is communicated through **Tonal Layering** rather than shadows. This maintains the "Dark Editorial" feel and avoids visual clutter.

- **Level 0 (Background):** Ink Navy (#0F172A). Used for the main canvas.
- **Level 1 (Surface):** Muted Slate (#1E293B). Used for cards, sidebars, and main content containers.
- **Level 2 (Interaction):** Subtle 1px borders using #334155 (Slate 700) to define boundaries. 
- **Focus States:** High-contrast 2px River Teal outlines for keyboard navigation and active input fields. 
- **No Shadows:** Shadows are strictly prohibited to keep the UI feeling flat, fast, and digital-native.

## Shapes
The shape language is **Stable and Structured**. A consistent 8px (Soft) radius is applied to all primary containers and buttons. This creates a professional look that is approachable but lacks the "bubbliness" of consumer apps.

- **Standard Radius:** 8px for buttons, inputs, and cards.
- **Small Radius:** 4px for tooltips and nested chips.
- **Strict Rule:** No fully rounded (pill) shapes are to be used, even for tags or buttons, to maintain the editorial grid aesthetic.

## Components
- **Buttons:** Primary buttons use solid River Teal with Mist text. Secondary buttons use a Muted Slate background with a 1px border. CTA buttons use Lantern Amber. All buttons use 8px rounding.
- **Input Fields:** Backgrounds are slightly darker than the surface color. Use a 1px border (#334155). On focus, the border changes to River Teal.
- **Data Tables:** High-density rows (32px - 40px height). Alternating row highlights are not used; instead, use 1px horizontal dividers.
- **Chips/Status Tags:** Rectangular with 4px rounding. Use low-opacity fills of the status color (e.g., 10% opacity Coral for "Delayed") with high-opacity text for readability.
- **Icons:** Use 20px Lucide-style outline icons with a 1.5px stroke weight. Icons should always be the same color as the accompanying text.
- **Operational Cards:** Use a Muted Slate background with a top-border accent color (e.g., a 4px teal stripe) to denote category or status.