# Design System Document

## 1. Overview & Creative North Star: "The Grounded Sanctuary"

Mental health resources, particularly in a trauma-informed Indian context, require a digital environment that feels stable, quiet, and deeply empathetic. The Creative North Star for this system is **"The Grounded Sanctuary."**

This is not a traditional grid-heavy resource site. Instead, it is an editorial experience that prioritizes psychological safety. We break the "template" look by utilizing generous white space (breathing room), intentional asymmetry in text placement, and soft, overlapping layers. By moving away from rigid boxes and harsh dividers, we create an interface that feels like a calm, guided conversation rather than a clinical database.

---

## 2. Colors: Tonal Depth & Soul

The palette is anchored in muted teals and soft lavenders, designed to lower the viewer's cognitive load and heart rate.

### The "No-Line" Rule

To maintain a feeling of softness, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a card using `surface-container-lowest` (#ffffff) should sit on a section background of `surface-container-low` (#eff3ff). This creates a "felt" boundary rather than a "seen" one.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers—like fine handmade paper stacked carefully.

- **Base Layer:** `surface` (#f9f9ff)
- **Content Zones:** `surface-container-low` (#eff3ff)
- **Interactive Cards:** `surface-container-lowest` (#ffffff)
- **Featured Highlights:** `surface-container-high` (#dee9fd)

### Signature Textures: Glass & Gradients

Flat colors can feel static. To provide "visual soul":

- **Main CTAs/Hero Backgrounds:** Use subtle linear gradients transitioning from `primary` (#630ed4) to `primary-container` (#7c3aed) at a 135-degree angle.
- **Floating Navigation:** Use **Glassmorphism**. Apply `surface` at 70% opacity with a `backdrop-filter: blur(12px)`. This integrates the UI into the background, making it feel less intrusive.

---

## 3. Typography: The Editorial Voice

The typography system balances the authority of a serif with the modern clarity of a geometric sans-serif.

- **Display & Headlines (Noto Serif):** Headings use a gentle serif to convey wisdom and history. Large `display-lg` and `headline-lg` should be set with slightly tighter letter-spacing (-0.02em) and generous leading to feel like a high-end journal.
- **Body & Labels (Plus Jakarta Sans):** The body text is approachable and highly legible. Use `body-lg` (1rem) as the standard for long-form reading to ensure it is culturally accessible for all age groups.
- **Hierarchy as Empathy:** Use `headline-md` for community stories and `title-lg` for navigational cues. This clear distinction helps users in distress find information without scanning effort.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are often too aggressive for a trauma-informed site. We use **Tonal Layering** to create hierarchy.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This provides a soft, natural lift without the "noise" of a shadow.
- **Ambient Shadows:** For elements that truly need to float (like a "Get Help" FAB), use an extra-diffused shadow: `box-shadow: 0 12px 32px rgba(18, 28, 42, 0.06)`. Note the use of a low-opacity version of `on-surface` (#121c2a) rather than pure black.
- **The "Ghost Border" Fallback:** If a container requires definition for accessibility (e.g., in a high-contrast state), use a "Ghost Border": `outline-variant` (#ccc3d8) at **15% opacity**.

---

## 5. Components

### Buttons

- **Primary:** Gradient fill (`primary` to `primary-container`), white text, `rounded-lg` (1rem). Padding: `12` (3rem) horizontal for a substantial, stable feel.
- **Secondary:** `secondary-container` (#6cf8bb) fill with `on-secondary-container` (#00714d) text. This teal shade provides a "calm action" alternative to the purple.
- **Tertiary:** No fill, `primary` text. Use for low-priority actions like "Learn More."

### Cards & Lists

- **Rule:** Forbid the use of divider lines.
- **Structure:** Separate list items using `spacing-6` (1.5rem) of vertical white space. Use `surface-variant` (#d9e3f7) as a background highlight for hovered list items.
- **Cards:** Use `rounded-xl` (1.5rem) for a friendly, non-threatening aesthetic.

### Input Fields

- **Styling:** Use `surface-container-lowest` backgrounds with a "Ghost Border." Labels should use `label-md` in `on-surface-variant` (#4a4455).
- **Focus State:** Transition the Ghost Border to a 100% opaque `primary` stroke to provide clear feedback.

### Unique Component: The "Safe Space" Toggle

A specialized chip-based filter used for resource categorization (e.g., "Family," "Work," "Self"). These use `secondary-fixed` (#6ffbbe) when active, providing a refreshing, grounded green that signals growth and safety.

---

## 6. Do's and Don'ts

### Do:

- **Use Asymmetric Layouts:** Position hero text to the left with a large amount of empty space to the right to reduce visual clutter.
- **Prioritize "Warm" Grays:** Always use the `surface` and `on-surface` tokens provided, which have blue/purple undertones, rather than neutral #555555.
- **Embrace Roundedness:** Stick to `xl` (1.5rem) for large containers to maintain the "soft" brand promise.

### Don't:

- **Don't use 1px Dividers:** Never use a line to separate sections. Use a background color shift from the Spacing Scale.
- **Don't use Pure Black:** Avoid #000000 for text. Use `on-surface` (#121c2a) to keep the contrast high but the "vibe" soft.
- **Don't Overcrowd:** If a screen feels full, increase the spacing from `8` (2rem) to `12` (3rem). In mental health UI, "less" is always "more supportive."
