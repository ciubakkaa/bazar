# Stitch Design Refresh

**Date:** 2026-03-29
**Scope:** Adopt 10 design improvements from stitch reference designs into the existing SvelteKit app.

## Context

The `stitch/` folder contains reference HTML/Tailwind exports showcasing a "Neo-Pop Editorial" design direction. These are static design references, not code to port. We extract the best ideas and implement them in the existing Svelte component architecture.

## Changes

### 1. Glass morphism on NavBar
- Add `backdrop-blur-xl` + semi-transparent background to the top nav and mobile bottom nav
- Replace solid white backgrounds with `bg-white/80` (or equivalent CSS)

### 2. Tonal layering — remove borders
- Audit card components (QuestionCard, ChecklistItem, ProfileCard) and page layouts
- Replace `border` declarations with background color shifts using existing bazar color tokens
- Use surface → gray-100 → white layering to create visual separation

### 3. Circular progress ring on checklist
- Replace the linear progress bar with an SVG circle using `stroke-dasharray`
- Show completed/total count in the center
- Add personalized greeting above ("Salut, {name}!")

### 4. Bento grid for checklist categories
- Replace the horizontal scrolling category filter buttons with a 2×3 responsive grid of category cards
- Each card shows: icon, category name, mini horizontal progress bar (completed/total), count text
- Cards are clickable to filter the checklist below
- Grid collapses to 2 columns on mobile

### 5. Rotated word highlights on landing page
- On the hero headline, wrap one key word in a `<span>` with yellow background + slight rotation (`-rotate-1`)
- Apply `inline-block` + `px-2` padding for the highlight effect

### 6. Unequal bento feature grid on landing page
- Replace the uniform 4-column feature grid with an asymmetric layout:
  - Row 1: 2/3 width card (Checklist) + 1/3 width card (Community, dark bg)
  - Row 2: Full-width card (Roommate matching, yellow bg)
- Each card gets distinct background treatment for visual rhythm

### 7. Vote column on Q&A cards
- Add a left-aligned vertical vote section to QuestionCard: up arrow, count, down arrow
- Voting is visual-only for now (no backend wiring needed)
- Adjust card layout to accommodate the vote column (flex row)

### 8. Pinned FAQ section on Q&A page
- Add a "Intrebari frecvente" section above the question feed
- Show 3 hardcoded FAQ cards in a responsive grid
- Each card: colored icon circle + question text + short answer preview

### 9. Trait chips on ProfileCard
- Add lifestyle trait pills below existing profile info
- Traits: array of emoji + label strings (e.g., "🌙 Night owl", "🔕 Quiet")
- Display as flex-wrap row of small rounded pills with light gray background

### 10. Floating stat card on landing page
- Add an overlapping card on/near the hero section
- Shows a social proof stat (e.g., "2,400+ colegi gasiti")
- Slightly rotated (`-rotate-2`), positioned with absolute/relative overlap
- White background, subtle shadow

## Files to modify

- `src/app.css` — glass morphism utilities, tonal layer tokens
- `src/lib/components/NavBar.svelte` — glass effect
- `src/lib/components/ChecklistItem.svelte` — remove borders, tonal layering
- `src/lib/components/QuestionCard.svelte` — vote column, remove borders
- `src/lib/components/ProfileCard.svelte` — trait chips, remove borders
- `src/routes/+page.svelte` — rotated highlight, bento features, floating stat card
- `src/routes/(app)/checklist/+page.svelte` — circular progress, bento categories, greeting
- `src/routes/(app)/qa/+page.svelte` — pinned FAQ section
- `src/routes/(app)/people/+page.svelte` — minor tonal adjustments if needed

## Non-goals

- No new pages or routes
- No backend changes
- No new dependencies
- Vote buttons are visual only (no API)
- No dark mode changes
