---
name: Cinematic Intelligence
colors:
  surface: '#041423'
  surface-dim: '#041423'
  surface-bright: '#2b3b4b'
  surface-container-lowest: '#000f1e'
  surface-container-low: '#0c1d2c'
  surface-container: '#112130'
  surface-container-high: '#1b2b3b'
  surface-container-highest: '#263646'
  on-surface: '#d4e4f9'
  on-surface-variant: '#bdc9c5'
  inverse-surface: '#d4e4f9'
  inverse-on-surface: '#223242'
  outline: '#879390'
  outline-variant: '#3d4946'
  surface-tint: '#72d8c5'
  primary: '#72d8c5'
  on-primary: '#003730'
  primary-container: '#34a190'
  on-primary-container: '#003029'
  inverse-primary: '#006b5e'
  secondary: '#ffb690'
  on-secondary: '#552100'
  secondary-container: '#ec6a06'
  on-secondary-container: '#4a1c00'
  tertiary: '#cac6be'
  on-tertiary: '#32302b'
  tertiary-container: '#949089'
  on-tertiary-container: '#2b2a24'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#8ff5e1'
  primary-fixed-dim: '#72d8c5'
  on-primary-fixed: '#00201b'
  on-primary-fixed-variant: '#005046'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#e7e2d9'
  tertiary-fixed-dim: '#cac6be'
  on-tertiary-fixed: '#1d1c16'
  on-tertiary-fixed-variant: '#494740'
  background: '#041423'
  on-background: '#d4e4f9'
  surface-variant: '#263646'
typography:
  display-lg:
    fontFamily: notoSerif
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: notoSerif
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: notoSerif
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: plusJakartaSans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: plusJakartaSans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: spaceGrotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  ui-action:
    fontFamily: plusJakartaSans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin: 48px
  container-max: 1440px
---

## Brand & Style

This design system establishes a high-end, cinematic atmosphere for a premier travel intelligence platform. The brand personality is authoritative yet adventurous, blending the precision of AI with the evocative nature of luxury travel. The target audience includes discerning travelers and digital nomads seeking data-driven insights without sacrificing the romance of exploration.

The visual style is a hybrid of **Modern Minimalism** and **Glassmorphism**. It utilizes expansive, full-bleed cinematic imagery as a foundation, overlaid with semi-transparent, map-inspired interface layers. The experience should evoke the feeling of looking through a high-tech viewfinder or a luxury navigator’s dashboard.

## Colors

The palette is anchored in **Deep Navy**, serving as the canvas to create a sophisticated, high-contrast environment. **Emerald Teal** acts as the primary conduit for AI-driven intelligence and primary actions, symbolizing growth and the lush landscapes of travel. **Sunset Orange** is used sparingly for high-energy CTAs and critical notifications.

**Ivory Sand** serves as a soft, tactile neutral for content cards and foreground text, ensuring readability against the dark backdrop while maintaining a warm, organic feel.

## Typography

This design system uses a sophisticated typographic trio to balance editorial flair with technical precision. 
- **notoSerif** is reserved for headlines and editorial titles, providing a classic, premium feel. 
- **plusJakartaSans** handles the primary UI and body text, offering a welcoming and modern clarity.
- **spaceGrotesk** is utilized for labels, data visualizations, and AI metadata to emphasize the "intelligence" aspect of the platform with a technical, futuristic edge.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for centralized content areas, transitioning to a flexible, map-inspired layout for discovery features. We use a 12-column grid with generous 24px gutters to allow the cinematic backgrounds to breathe. 

Spacing follows a strict 8px rhythmic scale. Large-scale imagery should often ignore standard margins to create an immersive, full-bleed "cinemascope" effect, while text-heavy intelligence reports are contained within a focused 8-column central span.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and tiered translucency rather than traditional drop shadows.
1. **Base Layer:** Immersive photography or map view.
2. **Surface Layer:** Semi-transparent Deep Navy (60-80% opacity) with a 20px backdrop blur and a 1px inner stroke in Ivory Sand (10% opacity).
3. **Active Layer:** Emerald Teal or Sunset Orange accents with a subtle outer glow to simulate "active" intelligence data.

Avoid heavy shadows; instead, use light-refracting borders and variable blur strengths to indicate hierarchy.

## Shapes

The design system employs **Rounded** geometry to balance the sharp precision of AI with the comfort of luxury hospitality. Standard UI components use an 8px (0.5rem) radius. Larger interactive cards and modals should scale up to 24px (1.5rem) to feel more like physical travel documents or modern architecture.

## Components

- **Buttons:** Primary buttons use a solid Emerald Teal fill with white text. Secondary buttons utilize a glass-morphic background with an Emerald Teal border.
- **CTAs:** High-priority conversion points use Sunset Orange with high-contrast Deep Navy text.
- **Cards:** Content containers use the Ivory Sand background at 90% opacity when over maps, or the glass-morphic Deep Navy style for overlays. They feature a 1px "silk" border.
- **Inputs:** Text fields are transparent with a 1px Ivory Sand bottom border, shifting to Emerald Teal on focus.
- **Chips/Badges:** Use **spaceGrotesk** in all-caps. Intelligence "confidence scores" are displayed in Emerald Teal badges.
- **Map Markers:** Custom markers utilizing a teardrop shape with a centered AI "spark" icon.
- **Intelligence Feed:** A specialized list component featuring a timeline-style vertical axis in Emerald Teal, connecting different travel insights.