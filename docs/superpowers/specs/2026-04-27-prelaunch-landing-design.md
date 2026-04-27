# Pre-Launch Landing Page — Design

**Status:** Draft → pending Vlad's approval
**Date:** 2026-04-27
**Domain:** thebazar.ro

## Goal

Convert the current at-launch homepage into a pre-launch marketing landing page so we can run paid ads, gauge target-audience response, and collect a waitlist before the app goes live. Public traffic must not reach the actual app routes (auth, checklist, qa, quiz, admin); admin/dev access still works via an unadvertised bypass.

## Non-goals

- No real registration, login, or app usage by the public.
- No translation of the rest of the app — i18n is set up for the landing page only.
- No newsletter broadcasting tooling — exporting waitlist data later is fine via Supabase or the existing admin panel.
- No payment / pricing questions in the form (audience is students; not relevant).
- No advertising of the roommate-matching feature pre-launch.

## High-level architecture

1. **Pre-launch mode toggle** — `PUBLIC_LAUNCH_MODE` env var (`prelaunch` | `live`). When `prelaunch`, a server hook redirects all non-public requests to `/`.
2. **Admin bypass** — visiting `/__admin?token=$PRELAUNCH_BYPASS_TOKEN` sets a signed HTTP-only cookie that exempts the request from the redirect. Admin can keep using the app at the unadvertised URLs.
3. **Landing page** — modified version of the current `/+page.svelte` with a redesigned bento grid (no roommates), a new preview section, and a new waitlist form.
4. **i18n** — Paraglide JS, cookie-based locale (no URL prefix). RO is source, EN is target. Only the landing page is translated; the rest of the app stays Romanian-hardcoded.
5. **Waitlist storage** — new `waitlist_signups` Supabase table, populated via SvelteKit form action. Resend pings Vlad's inbox on each new signup.

## Routing & access control

### Pre-launch hook

`src/hooks.server.ts` (new file or extend existing). Logic:

- If `PUBLIC_LAUNCH_MODE !== 'prelaunch'` → no-op (passthrough).
- If request path is in the public allowlist → passthrough.
  - Allowlist: `/`, `/api/locale`, `/__admin`, `/_app/*` (static assets), `/favicon.*`, public images.
  - The form actions live on `/` so they're already covered.
- If request has a valid `bazar_admin_bypass` cookie → passthrough.
- Otherwise → 302 redirect to `/`.

### Admin bypass

- Env var: `PRELAUNCH_BYPASS_TOKEN` — long random string set in Cloudflare Pages env.
- Endpoint: `/__admin` (server-only `+server.ts`)
  - Reads `?token=` query param.
  - If matches env token, sets cookie:
    - Name: `bazar_admin_bypass`
    - Value: signed JWT-like or HMAC of the token + expiry (we won't trust the raw token in the cookie — sign it).
    - Attributes: `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=2592000` (30d), `Path=/`.
  - Redirects to `/admin`.
  - If token mismatch, returns 404 (don't leak existence).
- The hook validates the signature on each request before honoring the bypass.

### Launching to live

Set `PUBLIC_LAUNCH_MODE=live` in Cloudflare Pages env and redeploy. Hook short-circuits to no-op; all routes accessible. No code changes needed.

## i18n (Paraglide)

### Setup

- Install: `@inlang/paraglide-js` and `@inlang/paraglide-sveltekit` (or whatever the current SvelteKit adapter is named at install time).
- Init: `npx @inlang/paraglide-js init` → choose `ro` source, `en` target.
- Vite plugin added to `vite.config.ts`.
- Generated code committed at `src/lib/paraglide/` (regenerated on `npm run build`).

### Locale handling

- **Strategy:** cookie-based (`PARAGLIDE_LOCALE`). No URL prefix — homepage stays at `/`.
- **Server:** hook reads cookie → sets request locale → passes to load functions / form actions.
- **Client:** `<html lang>` set from server. Fallback to `ro` if cookie missing or invalid.
- **Toggle:** `RO | EN` pill in nav. Click navigates to `/api/locale?to=en&redirect=<current_path>`; server sets the cookie and 302s back to the current page. Plain anchor — no JS needed.

### Message organization

Flat JSON keyed by section:

```json
{
  "landing.nav.subscribe": "Aboneaza-te",
  "landing.hero.tagline": "Lansare in vara 2026",
  "landing.hero.title_part1": "Inceputul facultatii",
  "landing.hero.title_haos": "haos.",
  ...
}
```

Estimated 50–70 keys for the full landing page.

## Landing page structure

Reuse the current visual style. Modifications:

### Nav

- Logo (unchanged)
- "Cum functioneaza" anchor → `#features`
- Removed: "Demo" link
- "Aboneaza-te" CTA (yellow pill) → anchors to `#waitlist`
- `RO | EN` toggle pill on the right

### Hero

- "Lansare in vara 2026" small tag above the heading (or similar — copy can be tuned)
- Same heading and floating mockup card as today
- Primary CTA: "Anunta-ma cand iese" → `#waitlist`
- Secondary CTA: "Vezi cum arata" → `#preview`
- Floating "2,400+ colegi gasiti azi" stat card → **removed** (misleading pre-launch). Replace the slot with a small honest tag if needed (e.g., "Lansare in vara 2026"), or leave the mockup card alone without it.

### Bento features grid (`#features`)

- Row 1: Checklist (2/3) + Comunitate (1/3) — unchanged from today
- Row 2: **Q&A** card, full-width, redesigned to fill the row visually (yellow background, two-column layout with an accent illustration on the right)
- Row that previously had roommates → **removed**

### Preview section (`#preview`)

NEW. Caption: "Asa va arata cand lansam." Two side-by-side mocked screens:

1. **Checklist screen** — Svelte component, looks like the real `/checklist` page. Static. Clicks do nothing.
2. **Q&A screen** — Svelte component, looks like the real `/qa` page. Static.

Built as Svelte components (not images) so they share the design system. On mobile, stack vertically.

### Social proof

- Header: "Construim primul pentru:"
- Same three pills (UPB, ASE, UB) but the green dot is replaced or kept depending on whether we want to imply readiness. Probably keep — it reads as "supported" not "live."

### Waitlist section (`#waitlist`)

See "Waitlist form" below.

### Bottom CTA

Repurpose the existing dark "Gata cu panica de boboc" block:

- Heading copy unchanged or slightly tweaked
- Subtitle: "Lasa-ne emailul si te anuntam cand iese."
- Button: "Aboneaza-te" → `#waitlist`

### Footer

Unchanged.

## Waitlist form

### Visual

Centered card on `bg-bazar-offwhite`, rounded, large padding. Heading: "Anunta-ma cand iese Bazar." Subtitle: "Iti scriem o singura data, cand lansam. Fara spam."

### Fields (always visible)

1. **Email** — `<input type="email">`, required, server-side regex validation.
2. **Universitate** — custom searchable combobox (Svelte 5 component, no library):
   - Trigger: text input with placeholder "Cauta facultatea"
   - Dropdown: filtered list, grouped by parent university
     - Group header (e.g., "UPB — Politehnica") rendered in **bold**, non-selectable
     - Faculties indented underneath, selectable
   - "Alta facultate" item at the bottom → reveals a free-text input below the combobox
   - Keyboard nav (arrow keys, enter, escape)
   - Selection sets two hidden form fields: `university` (parent) and `faculty` (or null)
   - Required (must select something or fill the "alta" text)
3. **Anul de studiu** — `<select>` with options:
   - Pre-universitar / liceu (value: `pre_uni`)
   - 1, 2, 3, 4, 5, 6
   - Required.

### Optional feedback (progressive disclosure)

- Checkbox: "Vreau sa ajut sa-l facem mai bun"
- When checked, this field fades in:
  - **"Care e partea cea mai haotica din inceputul facultatii?"** — `<textarea>`, optional, max 1000 chars

### Submit

- Button: "Trimite"
- Disabled with spinner during submission
- Success state: card content swaps for a thank-you message ("Te-am adaugat. Iti scriem la `<email>` cand lansam.")
- Error state: inline error above submit button

### Form mechanics

- SvelteKit form action `?/waitlist` on the landing page's `+page.server.ts`
- Progressive enhancement — works without JS via standard form post
- With JS, submission is via `use:enhance` for the swap-content UX

### Honeypot

Hidden `<input name="website" tabindex="-1">` — bots fill it; humans don't. Non-empty value → silent success (no row inserted, no email sent).

### Bucharest universities data

`src/lib/data/bucharest-universities.ts` — curated list of Bucharest higher-ed institutions and their faculties. Structure:

```ts
export const universities: { name: string; short?: string; faculties: string[] }[] = [
  {
    short: 'UPB',
    name: 'UPB — Universitatea Politehnica',
    faculties: ['Automatica si Calculatoare', 'Electronica, Telecomunicatii si Tehnologia Informatiei', /* ... */]
  },
  { short: 'UB', name: 'UB — Universitatea din Bucuresti', faculties: [/* ... */] },
  { short: 'ASE', name: 'ASE — Academia de Studii Economice', faculties: [/* ... */] },
  { short: 'UMF', name: 'UMF Carol Davila', faculties: [/* ... */] },
  { name: 'SNSPA', faculties: [/* ... */] },
  { name: 'UNATC', faculties: [/* ... */] },
  { name: 'UAUIM — Universitatea de Arhitectura "Ion Mincu"', faculties: [/* ... */] },
  { name: 'USAMV — Universitatea de Stiinte Agronomice', faculties: [/* ... */] },
  { name: 'UNMB — Universitatea Nationala de Muzica', faculties: [/* ... */] },
  { name: 'UNARTE — Universitatea Nationala de Arte', faculties: [/* ... */] },
  // private:
  { name: 'Universitatea Romano-Americana', faculties: [/* ... */] },
  { name: 'Universitatea Titu Maiorescu', faculties: [/* ... */] },
  { name: 'Universitatea Spiru Haret', faculties: [/* ... */] },
  { name: 'Universitatea Crestina Dimitrie Cantemir', faculties: [/* ... */] },
  { name: 'Universitatea Nicolae Titulescu', faculties: [/* ... */] },
  { name: 'Universitatea Hyperion', faculties: [/* ... */] },
];
```

Faculty lists curated from public university websites at implementation time. Initial coverage is "best-effort" — missing faculties can be picked via the "Alta facultate" path.

## Data layer

### Migration

`supabase/migrations/<timestamp>_waitlist_signups.sql`:

```sql
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  university text not null,
  faculty text,
  year_of_study text not null,
  feedback text,
  locale text not null default 'ro',
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create unique index waitlist_signups_email_lower_idx
  on public.waitlist_signups (lower(email));

create index waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

-- Public anonymous insert only:
create policy "anon can insert waitlist"
  on public.waitlist_signups
  for insert
  to anon
  with check (true);

-- No public select. Reads via service role only.
```

### Form action logic

In `src/routes/+page.server.ts`:

1. Parse form data, run server-side validation (email regex, required fields, lengths, year-of-study allowed values, university not blank).
2. Honeypot check — if `website` field has any value, return success without inserting.
3. Rate limit — count rows from this `ip_hash` in the last hour; if >= 5, return generic error.
4. Insert via Supabase service-role client (already exists at `src/lib/supabase-server.ts`). On unique-violation (duplicate email), return success without inserting (prevents enumeration).
5. Fire Resend email asynchronously (don't await — the response shouldn't block on it). Subject: `[Bazar] New signup: <email>`. Body: email, university, faculty, year, feedback if any.
6. Return `{ success: true, email }` so the UI can show the thank-you state.

### Resend wiring

Reuse the existing `RESEND_API_KEY` env var. Use a simple `fetch` to Resend's REST API (the codebase already uses Resend in the `verify-university-email` edge function — pattern there is reusable).

### IP hashing

`ip_hash = sha256(ip + IP_HASH_SECRET)`. New env var `IP_HASH_SECRET`. We never store the raw IP. The hash is only used for rate-limit dedup.

## Open questions resolved

- Routes blocked: yes, all non-public routes redirect to `/` while in prelaunch mode.
- Storage: Supabase + Resend ping (both, not either-or).
- i18n library: Paraglide.
- Form structure: combined waitlist + optional feedback, single form, progressive disclosure.
- University picker: searchable combobox grouped by parent institution.
- Year picker: pre-uni + 1–6.
- Roommate feature: not advertised on this version of the landing.
- Payment intent question: dropped.

## Files touched (preview list)

- `package.json` — add Paraglide deps
- `vite.config.ts` — Paraglide plugin
- `project.inlang/` — new (init output)
- `messages/ro.json`, `messages/en.json` — new
- `src/lib/paraglide/` — generated, committed
- `src/hooks.server.ts` — extend existing handle with pre-launch redirect logic + locale resolution (current file already wires Supabase server client + `safeGetSession`; we'll compose with `sequence` from `@sveltejs/kit/hooks`)
- `src/routes/+layout.svelte` — `<html lang>`, locale toggle wiring
- `src/routes/+page.svelte` — full landing page rewrite using Paraglide messages
- `src/routes/+page.server.ts` — waitlist form action
- `src/routes/__admin/+server.ts` — admin bypass endpoint
- `src/routes/api/locale/+server.ts` — locale toggle endpoint
- `src/lib/components/landing/UniversityCombobox.svelte` — new
- `src/lib/components/landing/WaitlistForm.svelte` — new
- `src/lib/components/landing/PreviewChecklist.svelte` — new
- `src/lib/components/landing/PreviewQA.svelte` — new
- `src/lib/data/bucharest-universities.ts` — new
- `src/lib/server/prelaunch.ts` — bypass cookie sign/verify helpers
- `src/lib/server/resend.ts` — small helper for sending the signup ping (or reuse existing pattern)
- `supabase/migrations/<timestamp>_waitlist_signups.sql` — new
- Cloudflare Pages env vars added: `PUBLIC_LAUNCH_MODE`, `PRELAUNCH_BYPASS_TOKEN`, `IP_HASH_SECRET`

## Risk / unknowns

- **Paraglide install hiccups** — the SvelteKit adapter has changed names/APIs over time. Implementation step verifies against current docs (likely via context7) before committing the integration.
- **Cookie signing** — we'll use `crypto.subtle` (Web Crypto, available on Cloudflare workers) for HMAC. Need to confirm the Cloudflare adapter exposes it the same way Node does.
- **University data completeness** — hand-curated lists go stale. "Alta facultate" path covers the gap.
- **Bot signups** — honeypot + IP rate limit should handle 95%+ of bot traffic. If we get hammered, add Cloudflare Turnstile.
