---
name: Midnight Felt Dark Neon
colors:
  surface: '#0f131b'
  surface-dim: '#0f131b'
  surface-bright: '#353941'
  surface-container-lowest: '#0a0e15'
  surface-container-low: '#181c23'
  surface-container: '#1c2027'
  surface-container-high: '#262a32'
  surface-container-highest: '#31353d'
  on-surface: '#dfe2ed'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe2ed'
  inverse-on-surface: '#2d3038'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff7a73'
  on-tertiary-container: '#79000e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0f131b'
  on-background: '#dfe2ed'
  surface-variant: '#31353d'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-pot-display:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.04em
  mono-bet-input:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  label-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-badge:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-action:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is tailored for elite live poker players operating in dimly lit casino environments, cardrooms, and private clubs. It pairs dark gaming-lounge aesthetics with the precision of high-frequency tactical trading software. The visual language blends tactile physical poker metaphors with futuristic electric accents—delivering high-speed legibility, zero peripheral glare, and thumb-first ergonomics.

The aesthetic fuses **Tactile Skeuomorphism** and **Dark Glassmorphism**:
- **Atmosphere:** Deep velvet midnight charcoal and dark slate canvases eliminate light bounce in dark rooms while minimizing eye fatigue over 12-hour sessions.
- **Lighting & Focus:** Controlled neon luminescence highlights active states, table positions, and live pot sizes without polluting the user's peripheral field.
- **Physicality:** Convex buttons, tactile edge highlights, and layered felt containers simulate high-end ceramic chips and matte tournament tables.
- **Ergonomics:** Critical interactive surfaces reside strictly within the natural sweep radius of the thumb (the lower 40% of the mobile viewport), ensuring rapid bet inputs between deals.

## Colors

The palette operates under a high-contrast dark room architecture. Background surfaces are organized into three tonal depth tiers:
- Canvas/Base: `#090D14` (Deep Velvet Black)
- Surface Felt: `#0F172A` (Obsidian Slate)
- Raised Containers: `#1E293B` (Graphite Layer)

### Brand & Functional Accents
- **Primary (Emerald Neon):** `#10B981` (Shade: `#059669`). Signifies active hero states, confirmations, checks, limps, and net positive session win-rates.
- **Secondary (Electric Ice Blue):** `#38BDF8` (Shade: `#0EA5E9`). Used for informational metrics, pot odds, positional badges (Button, Cutoff), and active streets.
- **Tertiary / Bet Action (Crimson Strike):** `#EF4444` (Shade: `#DC2626`). Reserved for high-stakes aggression: Bets, Raises, All-Ins, and loss states.
- **Call Action (Electric Cobalt):** `#3B82F6`. Dedicated to call actions and neutral commitment.
- **Fold Action (Metallic Graphite):** `#64748B`. Muted surface indicator for dead hands and passive folding.

### Four-Color Deck Engine
To prevent card confusion under dim casino ambient light, standard suits follow the four-color deck standard:
- **Spades (♠):** `#F8FAFC` (Pure Titanium White on dark surfaces)
- **Hearts (♥):** `#EF4444` (Vibrant Ruby)
- **Diamonds (♦):** `#38BDF8` (Electric Sapphire)
- **Clubs (♣):** `#22C55E` (Crisp Neon Emerald)

## Typography

The type hierarchy prioritizes high numerical readability and quick identification:
- **Headlines & Actions (Space Grotesk):** Provides a technical, geometric edge with tight letter-spacing for high-velocity street announcements (FLOP, TURN, RIVER, SHOWDOWN) and action buttons.
- **Body & Supporting Copy (Plus Jakarta Sans):** Delivers clean readability for player notes, villain tendencies, and table history without visual noise.
- **Data, Pots & Cards (JetBrains Mono):** Monospaced numeric precision prevents layout shifting during real-time pot updates, bet size increments, big blind multipliers (e.g., `2.5x BB`), and stack-to-pot ratios (SPR). Tabular figures are enforced for all live pot and chip values.

## Layout & Spacing

The layout is built mobile-first, using a 4-column fluid system for handheld devices and expanding to an 8-column layout on tablets. 

- **Thumb Zone Anchoring:** The screen is partitioned into three distinct tiers:
  1. *Header Utility (Top 15%):* Hand ID, blinds/ante, table format (e.g., 9-Max, 6-Max), and connectivity status.
  2. *Live Table & Felt View (Middle 45%):* Dynamic table visualizer, active positions, board cards, and running pot metrics.
  3. *Tactical Action Zone (Bottom 40%):* Sizing sliders, quick-fraction pills (`1/3`, `1/2`, `3/4`, `POT`, `ALL-IN`), and primary action buttons within effortless thumb sweep.
- **Safe Padding & Insets:** The canvas enforces a standard `1rem` margin on mobile, with a dedicated `env(safe-area-inset-bottom)` buffer to prevent iOS Home Bar and Android navigation conflicts.

## Elevation & Depth

Depth is conveyed through glowing light perimeters, dark glass layers, and tactile convex bevels rather than standard blurry drop-shadows, which wash out in dark palettes:

- **Surface 0 (Table Floor):** Deep Velvet `#090D14`. Solid, light-absorbing base.
- **Surface 1 (Felt Cards & Containers):** `#0F172A` with 70% opacity, `backdrop-filter: blur(16px)`, bound by a 1px border stroke of `rgba(255, 255, 255, 0.06)`.
- **Surface 2 (Floating Action Trays):** `#1E293B` with `backdrop-filter: blur(24px)` and a subtle interior highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.12)`.
- **Active Neon Micro-Glow:** Action buttons and active dealer pills emit a focused outer glow (`0 0 14px rgba(16, 185, 129, 0.35)` for primary emerald; `0 0 14px rgba(239, 68, 68, 0.35)` for aggression red).
- **Physical Inset Depressions:** Input fields, card slots, and unselected bet size toggles utilize an inset shadow (`inset 0 2px 4px rgba(0, 0, 0, 0.6)`) to convey physical indentation into the table felt.

## Shapes

A medium roundedness (`0.5rem` base, `1rem` for cards/panels) mirrors smooth poker table rails and precision plastic playing cards:
- **Playing Cards:** Engineered with `rounded-md` (`0.375rem`), preserving card aspect ratios (2.5:3.5) with clean interior borders.
- **Action Trays & Modals:** Standardized on `rounded-lg` (`1rem`) to keep the bottom interaction deck soft and comfortable against screen corners.
- **Pill Elements:** Bet presets, position badges, and suit tags use maximum pill roundness (`9999px`) to visually reference physical chip stacks and dealer buttons.

## Components

### Action Buttons
- **Tactile Convex Buttons:** Large thumb-targeted buttons (minimum height: `52px`). Surface features a subtle vertical gradient (`from-emerald-500 to-emerald-600` for Check, `from-red-500 to-red-600` for Bet/Raise), an inner highlight along the top border (`inset 0 1px 0 rgba(255, 255, 255, 0.25)`), and an active press state that drops brightness by 10% and resets elevation.
- **Fold Button:** Built with muted graphite (`#1E293B`), bordered with `rgba(100, 116, 139, 0.4)`, ensuring clear differentiation from aggressive action options.

### Quick-Bet Chips & Sizing Pills
- Horizontal scroll or 5-column grid of pill badges (`1/3 Pot`, `1/2 Pot`, `2/3 Pot`, `Pot`, `All-In`).
- Inactive state: `#1E293B` background with `#94A3B8` mono labels.
- Selected state: Bordered in primary neon emerald (`#10B981`) or cyan (`#38BDF8`), with an elevated micro-glow and bright white text.

### Playing Card Component
- Background: `#0F172A` with a crisp 1px stroke of `#334155`.
- Selected/Hero Card: Crisp white face background (`#F8FAFC`) with high-contrast suit rendering, or dark face with glowing suit glyphs based on player preference.
- Size standard: Large rank typography in the top-left, centered high-visibility vector suit icon.

### Live Table Position Badges
- Circular or pill-shaped tags representing positions (BTN, SB, BB, UTG, MP, CO).
- Dealer Button (BTN): Distinct golden highlight (`#F59E0B`) with black text.
- Hero Indicator: Permanent emerald neon outline ring (`box-shadow: 0 0 8px #10B981`).

### Input Fields & Steppers
- Stack and bet sizing text inputs use large tabular figures via `JetBrains Mono`.
- Flanked by physical `-` and `+` decrement/increment stepper buttons (minimum touch target `48x48px`) styled with concave depressed felt styling.

### Cards & Container Panels
- Glass-backed felt sheets with `rgba(15, 23, 42, 0.85)` fill, `backdrop-filter: blur(12px)`, and hairline borders (`rgba(255, 255, 255, 0.08)`).
- Card headers maintain tight, uppercase tracking (`Space Grotesk`, `label-badge`) to clearly mark current hand phase (PREFLOP, FLOP, TURN, RIVER).