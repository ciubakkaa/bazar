# Design System Documentation: The Neo-Pop Editorial

## 1. Overview & Creative North Star
### Creative North Star: "The Vibrant Curator"
This design system rejects the clinical, "safe" minimalism of generic SaaS templates. Instead, it embraces **Neo-Pop Editorial**—a high-energy visual language that blends the punchy, high-contrast aesthetics of Romanian street posters with the sophisticated structural precision of a premium digital experience.

We break the "template" look through **intentional asymmetry** and **exaggerated softness**. By pairing a high-octane yellow with a rigorous charcoal framework, we create a signature identity that feels "student-built" yet professionally curated. The goal is a UI that doesn't just display information but *performs* it.

---

## 2. Colors
Our palette is a high-contrast dialogue between energy and grounding.

### The "Yellow First" Mandate
The primary energy source is **Primary Container (#ffd709)**. Despite the Material token list including deeper ochres, this design system prioritizes the vibrant, energetic yellow for all brand-facing elements. 

*   **Primary:** Used for key emphasis.
*   **On-Primary / Inverse Surface:** Deep charcoals for maximum legibility against the yellow.
*   **Surface Hierarchy:** We use `surface` (#f5f6f7) as our canvas, layering `surface-container-low` and `surface-container-highest` to define structure.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. To separate a profile section from a feed, transition from `surface` to `surface-container-low`. Standard borders feel "default"; tonal shifts feel "designed."

### Glass & Gradient
To elevate the "Neo-Pop" vibe into a high-end space:
*   **Floating Navigation:** Use `surface-container-lowest` with a 20% opacity and a `backdrop-blur` of 20px.
*   **Signature Textures:** For Hero CTAs, use a subtle linear gradient from `primary_fixed` (#ffd709) to `primary_fixed_dim` (#efc900) at a 135-degree angle. This adds "soul" and prevents the yellow from feeling flat or "plastic."

---

## 3. Typography
Typography is our primary tool for expressing the "student-led" personality.

### The Playful Anchor: Space Grotesk
Used for all `display` and `headline` scales. Its quirky terminals and geometric construction feel hip and trendy. 
*   **Display-LG (3.5rem):** Use for high-impact editorial moments with -2% letter spacing.
*   **Headline-MD (1.75rem):** The workhorse for section headers.

### The Functional Counterpart: Plus Jakarta Sans
Used for `title`, `body`, and `label` scales. This provides the necessary "adult" legibility to balance the playful headlines.
*   **Body-LG (1rem):** Set with generous line-height (1.6) to ensure the interface feels "breathable" and premium.

---

## 4. Elevation & Depth
In this system, depth is organic, not structural. We move away from the "shadow-on-white" trope in favor of **Tonal Layering**.

### The Layering Principle
Think of the UI as a series of stacked, thick-cut cards. 
1.  **Level 0 (Base):** `surface`
2.  **Level 1 (Sections):** `surface-container-low`
3.  **Level 2 (Cards/Interactions):** `surface-container-lowest` (pure white)

### Ambient Shadows
Shadows are a last resort. When used (e.g., for floating action buttons), they must be **Ambient Shadows**:
*   **Blur:** 40px - 60px.
*   **Opacity:** 4% - 6%.
*   **Color:** Tinted with `on-surface` (#2c2f30). 
*   **Forbid:** Standard dark grey "drop shadows" or 1px high-contrast borders.

### The Ghost Border Fallback
If accessibility requires a container boundary, use a **Ghost Border**: `outline-variant` (#abadae) at 15% opacity. It should be felt, not seen.

---

## 5. Components
All components must utilize the **xl (3rem)** or **full (9999px)** roundedness scale to maintain the soft, approachable vibe.

*   **Buttons**: 
    *   **Primary:** `primary_container` (#ffd709) background with `on_surface` (#2c2f30) text. Shape: `round-full`.
    *   **Secondary:** `surface-container-highest` background. Shape: `round-xl`.
*   **Cards**: Forbid divider lines. Use `spacing-6` (2rem) as a vertical gutter to separate content. Cards should use `round-xl`.
*   **Input Fields**: Use `surface-container-high` as the background. No border. On focus, transition the background to `surface-container-highest` and add a "Ghost Border" of the `primary` yellow at 40% opacity.
*   **Chips**: Use `round-full` and `surface-container-highest`. When active, swap to `primary_container`.
*   **The "Bazar Badge"**: A custom component for student deals. A `round-xl` container using `tertiary_container` (#ff928c) with `on_tertiary_container` (#69000c) text.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical spacing. A left margin of `spacing-8` and a right margin of `spacing-4` can make a header feel editorial.
*   **Do** lean into the energetic yellow for "Moments of Delight"—success states, empty state illustrations, and CTA hovers.
*   **Do** use `round-full` for all interactive elements like buttons and chips to invite touch.

### Don't
*   **Don't** use olive or muddy tones (`primary: #6c5a00`). While present in the logic, they clash with the "Fresh and Hip" mandate. Stick to the brights.
*   **Don't** use "Dividers." If you need to separate content, use a background color shift or `spacing-10` (3.5rem) of white space.
*   **Don't** use standard 12-column grids religiously. Allow elements to overlap or "break out" of the container to enhance the Neo-Pop feel.
*   **Don't** use pure black (#000000) for text. Use `on-background` (#2c2f30) to keep the "warm" vibe of the system intact.