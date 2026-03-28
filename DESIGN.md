# CPTSD.in — Design System

## Philosophy: The Grounded Sanctuary

CPTSD.in is a trauma-informed mental health resource for an Indian audience. The interface must feel like a calm, quiet room — not a clinical database or a busy dashboard. Every design decision serves one goal: **psychological safety**.

The three principles this flows from:

1. **Low stimulation** — avoid visual noise, bright colors, busy patterns, or rapid motion
2. **Legibility first** — distressed users should not have to hunt for information
3. **Warmth without drama** — the palette signals safety, not urgency

---

## Color System

### Core Palette

| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Teal (Primary) | `#5b8a9f` | — | Links, active states, accents, interactive text |
| Teal Dark | `#4a7283` | — | Link hover state |
| Ink | `#2d3436` | — | All headings, body text |
| Mid Gray | `#636e72` | — | Blockquotes, secondary text |
| Warm Gray | `#6b7280` | `--warm-gray` | Labels, tertiary text |
| Page Background | `#fafafa` | — | Root `<body>` background |
| White | `#ffffff` | — | Cards, panels |

### Calming Pastel Palette

Defined as CSS custom properties on `:root`. Use for tints, tag backgrounds, button gradients, and section accents.

| Variable | Hex | Mood |
|----------|-----|------|
| `--soft-lavender` | `#d4c5e8` | Calming, grounding |
| `--gentle-mint` | `#a8d5ba` | Growth, safety |
| `--warm-peach` | `#e8d4c1` | Comfort, warmth |
| `--sky-blue` | `#b8c5d6` | Clarity, openness |
| `--sage-green` | `#a8c5a5` | Stability, nature |
| `--dusty-rose` | `#d4a5c7` | Softness, care |
| `--soft-cream` | `#f5f1eb` | Warmth, rest |

To apply a tinted background using a CSS variable: `bg-[var(--sage-green)]/20`

### Alert / Status Colors

| Role | Tailwind | Use Case |
|------|----------|----------|
| Crisis / Warning | `bg-amber-50 border-amber-400` | Crisis banner, urgent callouts |
| Informational | `bg-blue-50 border-blue-200` | Tips, additional context |
| Neutral badge | `bg-gray-100 text-gray-600` | Tags, metadata labels |

### Rules

- **Never use pure black (`#000000`) for text.** Use `#2d3436` (ink) — it reads as dark but stays soft.
- **No 1px dividers between content sections.** Use background color shifts to create boundaries. A `bg-white` card on a `bg-gray-50` section is a boundary.
- If a border is unavoidable (e.g., table rows, code blocks), use `border-gray-200` (`#e9ecef`).

---

## Typography

### Font Stack

The site uses the **system font stack** for performance and platform-native legibility:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
  Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
```

No external font loads. This keeps the page fast and avoids layout shifts — critical for users on slow connections in India.

### Type Scale

| Context | Classes | Notes |
|---------|---------|-------|
| Hero heading | `text-4xl md:text-5xl lg:text-6xl font-bold` | Homepage H1 |
| Section heading | `text-3xl font-bold` | H2 |
| Card title | `text-xl font-semibold` | H3 |
| Sub-label | `text-lg font-semibold` | Sidebar headers |
| Body text | `text-base leading-relaxed` | Standard reading |
| Secondary text | `text-sm text-gray-600` | Timestamps, descriptions |
| Badge / label | `text-xs font-medium` | Tags, badges |

### Leading

- Headings: `leading-tight` (1.3) — avoids sprawling multi-line titles
- Body text: `leading-relaxed` (1.625) or `leading-7` — comfortable reading rhythm
- Prose (articles): `line-height: 1.8` — long-form reading comfort
- Standard paragraphs: `line-height: 1.7`

### Prose (Article Content)

Long-form article content uses the `.prose` class. Key values:

- Max width: `70ch` — the ideal line length for reading
- Font size: `1.125rem`
- `h2` gets a `border-bottom: 2px solid #e9ecef` — the one sanctioned divider line, inside article body only
- `blockquote`: left border `4px solid #9fb3a7` (sage), `bg-#fafafa`, italic, `color: #636e72`
- `code`: `bg-gray-100`, `color: #4a7283` (teal variant), `font-family: Monaco/Consolas`
- `pre`: dark background `#2d3436`, white text, `border-radius: 0.75rem`
- Images: `max-width: 800px`, `border-radius: 0.75rem`, soft multi-layer box shadow

---

## Layout

### Container

```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

- Max width: `1280px` (`max-w-7xl`)
- Horizontal padding scales with viewport: `px-4` → `sm:px-6` → `lg:px-8`

### Content Widths

| Width | Usage |
|-------|-------|
| `max-w-7xl` | Full page container, navigation |
| `max-w-4xl` | Sub-page content, listing pages |
| `max-w-3xl` | Article body, prose content |
| `70ch` | Prose `.prose` max-width |

### Grid Patterns

```html
<!-- Standard 3-column card grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- Two-column with sidebar -->
<div class="flex flex-col lg:flex-row gap-8">
```

### Vertical Spacing

Use these section padding values consistently:

| Scope | Classes |
|-------|---------|
| Page sections | `py-12` |
| Inner section padding | `py-8` |
| Card padding | `p-6` |
| Compact items (lists) | `py-2 px-3` |

White space is a design element. When a screen feels crowded, increase spacing — don't reduce font size or tighten padding.

---

## Components

### Header

```
bg-white border-b border-gray-200 sticky top-0 z-[70]
```

- Sticky with `z-[70]` — above floating pets (also at z-70 but bounded below header)
- Logo: 40×40px SVG
- Nav links: `text-gray-700 hover:text-gray-900`
- Mobile: hamburger icon, slide-down menu

### Cards

```html
<div class="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
```

- Background: `bg-white`
- Border: `border border-gray-200`
- Radius: `rounded-lg` (8px) — friendly but not bubble-like
- Hover: `hover:shadow-lg` — subtle elevation, no color change
- Image zoom on hover: `group-hover:scale-110 transition-transform duration-500`

For featured content cards that need more visual weight: `rounded-2xl` (16px).

### Buttons

Three button styles defined as global CSS classes in `globals.css`:

```css
.btn-primary   → gradient lavender→sky-blue  (#d4c5e8 → #b8c5d6)
.btn-secondary → gradient mint→sage          (#a8d5ba → #a8c5a5)
.btn-accent    → gradient peach→rose         (#e8d4c1 → #d4a5c7)
```

All buttons share:
- `border-radius: 0.75rem` (12px)
- `padding: 0.75rem 1.5rem`
- `font-weight: 500`
- `transition: all 0.3s ease`
- Hover: `translateY(-1px)` + `box-shadow: 0 4px 12px rgba(..., 0.3)`
- Subtle 30%-opacity border matching the gradient color

For inline/text actions use: `text-[#5b8a9f] font-medium hover:underline`

### Badges & Tags

```html
<!-- Topic / category badge -->
<span class="px-3 py-1 bg-[var(--sage-green)]/20 text-[#5b8a9f] rounded-full text-sm font-medium">

<!-- Neutral metadata tag -->
<span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">
```

### Input Fields

```html
<input class="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--soft-lavender)] focus:border-transparent">
```

- Default: `border-gray-300`
- Focus ring: `var(--soft-lavender)` — soft, not alarming
- Border disappears on focus (ring replaces it)

### Crisis Banner

```html
<div class="bg-amber-50 border-b border-amber-200 py-3 px-4">
  <p class="text-sm text-amber-900">...</p>
</div>
```

Amber communicates attention without panic. Never use red for this component — red reads as danger/emergency, which increases distress.

### Blog Sidebar

```
hidden lg:block w-64 flex-shrink-0 bg-white border-r border-gray-200
sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto
```

- Section headers: `text-xs font-bold text-[#5b8a9f] uppercase tracking-wider`
- Nav items: `px-3 py-2 text-sm text-gray-700 hover:text-[#5b8a9f] hover:bg-gray-50 rounded-lg`
- Active: `text-[#5b8a9f] bg-[#9fb3a7]/20 font-semibold`

### Footer

```
bg-gray-50 border-t border-gray-200 mt-16
```

- Three-column grid: `grid grid-cols-1 md:grid-cols-3 gap-8`
- Disclaimer box: `bg-gray-100 rounded-lg p-4`
- Text: `text-sm text-gray-600`

---

## Floating Pets

The floating pets are a core UX element — companion characters that make the site feel inhabited and warm. They are technically complex; key constraints:

- Container: `position: fixed; inset: 0; pointer-events: none; z-index: 60`
- Individual pets: `position: fixed; z-index: 70; pointer-events: auto`
- **Pets must not enter the header zone.** The minimum Y position is `120px` (`MIN_PET_Y = 120`) — this clears the sticky header (64px) plus the crisis banner (~40px).
- Continuous bobbing: `petFloat` keyframe animation (4s ease-in-out infinite)
- Each pet gets `--pet-delay` CSS variable for varied animation offsets

---

## Motion & Animation

### Principles

- Animations should feel organic, not mechanical
- Duration: 0.3s–0.8s for interactions, 1.5s for state changes, 4s for ambient loops
- Easing: `ease-in-out` for most transitions, `ease-out` for entrances
- No rapid flashing, no sudden large movements (accessibility + trauma sensitivity)

### Global Transitions

Every element has a low-cost base transition:

```css
* { transition: color 0.2s ease, background-color 0.2s ease; }
```

### Interaction Patterns

| Trigger | Effect |
|---------|--------|
| Card hover | `hover:shadow-lg` lift |
| Button hover | `-1px` Y translate + shadow |
| Image hover | `scale(1.1)` zoom (parent `overflow-hidden`) |
| Link hover | Color shift to `#5b8a9f` |
| Pet click | Shake / flip / bounce (0.6–0.8s) |

### Fade In

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-fade-in { animation: fade-in 0.4s ease-out; }
```

---

## Accessibility

- **Color contrast:** `#2d3436` on `#ffffff` = 13.2:1 (AAA). `#5b8a9f` on white = 4.6:1 (AA for normal text).
- **Font size:** Base `1rem` for body, never below `0.75rem` for visible labels.
- **Focus rings:** Soft lavender ring on all inputs — visible without feeling aggressive.
- **Reduced motion:** Pet animations use CSS transitions; if `prefers-reduced-motion` support is added in future, target `.floating-pet { transition: none; animation: none; }`.
- **Semantic HTML:** Use `<article>`, `<nav>`, `<main>`, `<aside>` over generic `<div>` wherever possible.

---

## Do's and Don'ts

### Do

- **Use whitespace as an active design element** — if a page feels busy, add more padding
- **Use `#5b8a9f` teal** as the single interactive color — it's calming and distinct
- **Use CSS variable tints** for accent backgrounds: `bg-[var(--sage-green)]/20`
- **Keep cards simple** — white card on `gray-50` section is enough hierarchy
- **Prefer `rounded-lg`** (8px) for cards, `rounded-full` for badges, `rounded-2xl` for large feature blocks

### Don't

- **Don't use vibrant or saturated colors** outside the predefined pastel palette
- **Don't use 1px rule lines** to separate sections — use a background shift instead
- **Don't use pure black** (`#000000`) anywhere — use `#2d3436`
- **Don't overcrowd** — a content-heavy section should get more vertical padding, not smaller text
- **Don't add red for alerts** — amber is enough; red reads as emergency and increases distress
- **Don't let pets enter the header zone** — `MIN_PET_Y = 120` is a hard constraint

---

## Responsive Breakpoints

Standard Tailwind breakpoints — no custom breakpoints defined.

| Breakpoint | Min Width | Common Pattern |
|------------|----------|----------------|
| `sm:` | 640px | Wider padding: `sm:px-6` |
| `md:` | 768px | Two columns, show desktop nav |
| `lg:` | 1024px | Three columns, show sidebar |

Mobile-first: define the mobile state first, then override with `md:` and `lg:`.

---

## Z-Index Layers

| Layer | Z-Index | Element |
|-------|---------|---------|
| Page content | 0–10 | Normal flow |
| Floating pets container | 60 | `pointer-events: none` |
| Header | 70 | `sticky top-0` |
| Floating pet sprites | 70 | `pointer-events: auto` |
| Pet control button | 100 | Bottom-right FAB |
| Pet speech bubbles | 100 | `position: absolute` |

The header and pets share z-70, but pets are bounded to `y > 120px` so they cannot overlap the header.
