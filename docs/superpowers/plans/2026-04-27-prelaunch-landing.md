# Pre-Launch Landing Implementation Plan

**Goal:** Convert the homepage into a pre-launch marketing page with waitlist + feedback capture, RO/EN i18n, and a server-side gate that blocks public access to app routes.

**Architecture:** SvelteKit handle hook gates non-public routes via signed-cookie bypass. Landing page is rebuilt incrementally — first Romanian-hardcoded with the new structure (waitlist form, preview cards, no roommates), then string-extracted into Paraglide. Form submissions land in a new `waitlist_signups` Supabase table and trigger a Resend ping.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, Tailwind v4, Supabase (Postgres + RLS), Resend (transactional email), Paraglide JS (i18n), Cloudflare Pages adapter, Vitest.

Spec: `docs/superpowers/specs/2026-04-27-prelaunch-landing-design.md`.

---

## Order of work

1. Migration + Bucharest universities data (no app coupling)
2. Pre-launch hook + admin bypass (gates everything else)
3. Waitlist form action + components (Romanian-hardcoded first)
4. Preview components + landing page rewrite
5. Paraglide install + string extraction + locale toggle
6. End-to-end manual verification

---

## Task 1: Waitlist Supabase migration

**Files:**
- Create: `supabase/migrations/003_waitlist_signups.sql`

- [ ] Write migration SQL:

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

create index waitlist_signups_ip_hash_created_idx
  on public.waitlist_signups (ip_hash, created_at desc);

alter table public.waitlist_signups enable row level security;

create policy "anon can insert waitlist"
  on public.waitlist_signups
  for insert
  to anon
  with check (true);
```

- [ ] Apply via Supabase MCP or `supabase db push` (Vlad's choice — note in commit message which path was used).
- [ ] Regenerate `src/lib/database.types.ts` if it's auto-generated (otherwise hand-add the `waitlist_signups` row type — see Task 6).
- [ ] Commit:

```bash
git add supabase/migrations/003_waitlist_signups.sql src/lib/database.types.ts
git commit -m "feat: add waitlist_signups table with anon-insert RLS"
```

---

## Task 2: Bucharest universities data

**Files:**
- Create: `src/lib/data/bucharest-universities.ts`

- [ ] Write the data file with curated Bucharest higher-ed institutions and their main faculties:

```ts
export type UniversityGroup = {
  short?: string;
  name: string;
  faculties: string[];
};

export const bucharestUniversities: UniversityGroup[] = [
  {
    short: 'UPB',
    name: 'UPB — Universitatea Politehnica',
    faculties: [
      'Automatica si Calculatoare',
      'Electronica, Telecomunicatii si Tehnologia Informatiei',
      'Inginerie Electrica',
      'Energetica',
      'Inginerie Mecanica si Mecatronica',
      'Inginerie Industriala si Robotica',
      'Stiinta si Ingineria Materialelor',
      'Inginerie Chimica si Biotehnologii',
      'Transporturi',
      'Inginerie Aerospatiala',
      'Inginerie in Limbi Straine',
      'Inginerie Medicala',
      'Antreprenoriat, Ingineria si Managementul Afacerilor',
    ],
  },
  {
    short: 'UB',
    name: 'UB — Universitatea din Bucuresti',
    faculties: [
      'Matematica si Informatica',
      'Fizica',
      'Chimie',
      'Biologie',
      'Geologie si Geofizica',
      'Geografie',
      'Litere',
      'Limbi si Literaturi Straine',
      'Istorie',
      'Filosofie',
      'Sociologie si Asistenta Sociala',
      'Psihologie si Stiintele Educatiei',
      'Stiinte Politice',
      'Jurnalism si Stiintele Comunicarii',
      'Drept',
      'Administratie si Afaceri',
      'Teologie Ortodoxa',
      'Teologie Romano-Catolica',
      'Teologie Baptista',
    ],
  },
  {
    short: 'ASE',
    name: 'ASE — Academia de Studii Economice',
    faculties: [
      'Cibernetica, Statistica si Informatica Economica',
      'Contabilitate si Informatica de Gestiune',
      'Finante, Asigurari, Banci si Burse de Valori',
      'Management',
      'Marketing',
      'Economie Teoretica si Aplicata',
      'Administrarea Afacerilor (cu predare in limbi straine)',
      'Relatii Economice Internationale',
      'Administratie si Management Public',
      'Economie Agroalimentara si a Mediului',
      'Business si Turism',
    ],
  },
  {
    short: 'UMF',
    name: 'UMF Carol Davila',
    faculties: ['Medicina', 'Medicina Dentara', 'Farmacie', 'Moase si Asistenta Medicala'],
  },
  {
    name: 'SNSPA — Scoala Nationala de Studii Politice si Administrative',
    faculties: [
      'Stiinte Politice',
      'Administratie Publica',
      'Comunicare si Relatii Publice',
      'Management',
      'Sociologie',
    ],
  },
  {
    name: 'UNATC — Universitatea Nationala de Arta Teatrala si Cinematografica',
    faculties: ['Teatru', 'Film'],
  },
  {
    name: 'UAUIM — Universitatea de Arhitectura "Ion Mincu"',
    faculties: ['Arhitectura', 'Urbanism', 'Arhitectura de Interior'],
  },
  {
    name: 'USAMV — Universitatea de Stiinte Agronomice si Medicina Veterinara',
    faculties: [
      'Agricultura',
      'Horticultura',
      'Zootehnie',
      'Medicina Veterinara',
      'Imbunatatiri Funciare si Ingineria Mediului',
      'Biotehnologii',
      'Management si Dezvoltare Rurala',
    ],
  },
  {
    name: 'UNMB — Universitatea Nationala de Muzica',
    faculties: ['Interpretare Muzicala', 'Compozitie, Muzicologie si Pedagogie Muzicala'],
  },
  {
    name: 'UNARTE — Universitatea Nationala de Arte',
    faculties: ['Arte Plastice', 'Arte Decorative si Design', 'Istoria si Teoria Artei'],
  },
  {
    name: 'ANEFS — Academia Nationala de Educatie Fizica si Sport',
    faculties: ['Educatie Fizica si Sport', 'Kinetoterapie'],
  },
  {
    name: 'Universitatea Romano-Americana',
    faculties: [
      'Informatica Manageriala',
      'Management-Marketing',
      'Drept',
      'Relatii Internationale si Studii Europene',
      'Studii Economice Europene',
      'Economia Turismului Intern si International',
    ],
  },
  {
    name: 'Universitatea Titu Maiorescu',
    faculties: ['Drept', 'Medicina', 'Medicina Dentara', 'Farmacie', 'Informatica', 'Psihologie', 'Stiinte Economice'],
  },
  {
    name: 'Universitatea Spiru Haret',
    faculties: ['Drept si Administratie Publica', 'Stiinte Economice', 'Psihologie si Stiintele Educatiei', 'Stiinte Juridice, Economice si Administrative'],
  },
  {
    name: 'Universitatea Crestina Dimitrie Cantemir',
    faculties: ['Drept', 'Stiinte Economice', 'Limbi si Literaturi Straine', 'Relatii Internationale, Istorie si Filosofie'],
  },
  {
    name: 'Universitatea Nicolae Titulescu',
    faculties: ['Drept', 'Stiinte Economice', 'Stiinte Sociale si Administrative'],
  },
  {
    name: 'Universitatea Hyperion',
    faculties: ['Stiinte Economice', 'Stiinte Juridice si Administrative', 'Jurnalism', 'Arte', 'Psihologie si Stiintele Educatiei'],
  },
];
```

- [ ] Commit:

```bash
git add src/lib/data/bucharest-universities.ts
git commit -m "feat: add curated Bucharest universities + faculties dataset"
```

---

## Task 3: Pre-launch cookie signing helpers (with tests)

**Files:**
- Create: `src/lib/server/prelaunch.ts`
- Create: `tests/unit/prelaunch.test.ts`

- [ ] Write failing test `tests/unit/prelaunch.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { signBypassCookie, verifyBypassCookie } from '$lib/server/prelaunch';

const SECRET = 'test-secret-please-rotate';

describe('prelaunch bypass cookie', () => {
  it('round-trips a valid cookie', async () => {
    const cookie = await signBypassCookie(SECRET, 60_000);
    const result = await verifyBypassCookie(SECRET, cookie);
    expect(result).toBe(true);
  });

  it('rejects a tampered cookie', async () => {
    const cookie = await signBypassCookie(SECRET, 60_000);
    const tampered = cookie.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a'));
    expect(await verifyBypassCookie(SECRET, tampered)).toBe(false);
  });

  it('rejects an expired cookie', async () => {
    const cookie = await signBypassCookie(SECRET, -1000);
    expect(await verifyBypassCookie(SECRET, cookie)).toBe(false);
  });

  it('rejects a cookie signed with a different secret', async () => {
    const cookie = await signBypassCookie(SECRET, 60_000);
    expect(await verifyBypassCookie('other-secret', cookie)).toBe(false);
  });

  it('rejects garbage input', async () => {
    expect(await verifyBypassCookie(SECRET, '')).toBe(false);
    expect(await verifyBypassCookie(SECRET, 'not-a-cookie')).toBe(false);
    expect(await verifyBypassCookie(SECRET, 'a.b')).toBe(false);
  });
});
```

- [ ] Run test, expect FAIL (module not found):

```bash
npm test -- prelaunch
```

- [ ] Implement `src/lib/server/prelaunch.ts`:

```ts
// Web-Crypto HMAC-SHA256 — works on Node, Bun, and Cloudflare workers.
const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Returns a cookie value of the form `<expiresAtMs>.<base64url(hmac)>`.
 * The expiry is enforced at verify time.
 */
export async function signBypassCookie(secret: string, ttlMs: number): Promise<string> {
  const expiresAt = Date.now() + ttlMs;
  const payload = String(expiresAt);
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyBypassCookie(secret: string, cookie: string | undefined | null): Promise<boolean> {
  if (!cookie) return false;
  const dot = cookie.indexOf('.');
  if (dot <= 0 || dot === cookie.length - 1) return false;
  const payload = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt < Date.now()) return false;
  const expected = await hmac(secret, payload);
  return timingSafeEqual(sig, expected);
}

export const BYPASS_COOKIE_NAME = 'bazar_admin_bypass';
export const BYPASS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
```

- [ ] Run tests, expect PASS:

```bash
npm test -- prelaunch
```

- [ ] Commit:

```bash
git add src/lib/server/prelaunch.ts tests/unit/prelaunch.test.ts
git commit -m "feat: HMAC-signed pre-launch admin bypass cookie helpers"
```

---

## Task 4: Pre-launch route gate (with tests)

**Files:**
- Create: `src/lib/server/prelaunch-gate.ts`
- Create: `tests/unit/prelaunch-gate.test.ts`
- Modify: `src/hooks.server.ts`

The route-decision logic is a pure function; testing it is straightforward.

- [ ] Write failing test `tests/unit/prelaunch-gate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isPublicPath } from '$lib/server/prelaunch-gate';

describe('isPublicPath', () => {
  it('allows the root', () => {
    expect(isPublicPath('/')).toBe(true);
  });

  it('allows the locale switch endpoint', () => {
    expect(isPublicPath('/api/locale')).toBe(true);
  });

  it('allows the admin bypass entrypoint', () => {
    expect(isPublicPath('/__admin')).toBe(true);
  });

  it('allows static assets', () => {
    expect(isPublicPath('/_app/immutable/chunks/foo.js')).toBe(true);
    expect(isPublicPath('/favicon.ico')).toBe(true);
    expect(isPublicPath('/favicon.svg')).toBe(true);
  });

  it('blocks app routes', () => {
    expect(isPublicPath('/login')).toBe(false);
    expect(isPublicPath('/register')).toBe(false);
    expect(isPublicPath('/checklist')).toBe(false);
    expect(isPublicPath('/qa')).toBe(false);
    expect(isPublicPath('/admin')).toBe(false);
    expect(isPublicPath('/admin/anything')).toBe(false);
  });
});
```

- [ ] Run, expect FAIL.

- [ ] Implement `src/lib/server/prelaunch-gate.ts`:

```ts
const STATIC_PREFIXES = ['/_app/', '/favicon.'];
const PUBLIC_EXACT = new Set(['/', '/api/locale', '/__admin']);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  for (const prefix of STATIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}
```

- [ ] Run tests, expect PASS.

- [ ] Modify `src/hooks.server.ts` to compose existing logic with the pre-launch gate:

```ts
import { createServerSupabaseClient } from '$lib/supabase-server';
import { isPublicPath } from '$lib/server/prelaunch-gate';
import { verifyBypassCookie, BYPASS_COOKIE_NAME } from '$lib/server/prelaunch';
import { env } from '$env/dynamic/private';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';

const supabaseHandle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerSupabaseClient(event.cookies);

  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };

    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

const prelaunchHandle: Handle = async ({ event, resolve }) => {
  const mode = env.PUBLIC_LAUNCH_MODE ?? 'prelaunch';
  if (mode !== 'prelaunch') return resolve(event);

  const path = event.url.pathname;
  if (isPublicPath(path)) return resolve(event);

  const secret = env.PRELAUNCH_BYPASS_TOKEN;
  if (secret) {
    const cookie = event.cookies.get(BYPASS_COOKIE_NAME);
    if (await verifyBypassCookie(secret, cookie)) return resolve(event);
  }

  throw redirect(302, '/');
};

export const handle = sequence(prelaunchHandle, supabaseHandle);
```

- [ ] Run full test suite to make sure nothing else broke:

```bash
npm test
```

- [ ] Commit:

```bash
git add src/hooks.server.ts src/lib/server/prelaunch-gate.ts tests/unit/prelaunch-gate.test.ts
git commit -m "feat: pre-launch route gate with admin bypass cookie"
```

---

## Task 5: Admin bypass entrypoint

**Files:**
- Create: `src/routes/__admin/+server.ts`

- [ ] Write `src/routes/__admin/+server.ts`:

```ts
import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
  signBypassCookie,
  BYPASS_COOKIE_NAME,
  BYPASS_TTL_MS,
} from '$lib/server/prelaunch';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const secret = env.PRELAUNCH_BYPASS_TOKEN;
  if (!secret) throw error(404, 'Not found');

  const provided = url.searchParams.get('token') ?? '';
  // Constant-time-ish compare via length + char xor isn't critical here
  // (the cookie itself is HMAC-protected), but we still avoid leaking via
  // early-exit timing.
  if (provided.length !== secret.length) throw error(404, 'Not found');
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= provided.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  if (diff !== 0) throw error(404, 'Not found');

  const cookieValue = await signBypassCookie(secret, BYPASS_TTL_MS);
  cookies.set(BYPASS_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(BYPASS_TTL_MS / 1000),
  });

  throw redirect(302, '/admin');
};
```

- [ ] Manual verification (after dev server starts in Task 14):
  - `PRELAUNCH_BYPASS_TOKEN=test123 npm run dev`
  - Visit `http://localhost:5173/login` → redirected to `/`
  - Visit `http://localhost:5173/__admin?token=wrong` → 404
  - Visit `http://localhost:5173/__admin?token=test123` → cookie set, redirected to `/admin`, subsequent visits to `/login` etc. now pass through.
  - (The manual check can be deferred to the final verification task — listed here for reference.)

- [ ] Commit:

```bash
git add src/routes/__admin/+server.ts
git commit -m "feat: __admin token endpoint sets bypass cookie"
```

---

## Task 6: Form action + database type

**Files:**
- Modify: `src/lib/database.types.ts`
- Create: `src/lib/server/waitlist.ts`
- Create: `tests/unit/waitlist.test.ts`
- Create: `src/routes/+page.server.ts`

### 6a — Database type addition

- [ ] Add the `waitlist_signups` row type to `src/lib/database.types.ts`. Locate the `public.Tables` block and add:

```ts
waitlist_signups: {
  Row: {
    id: string;
    email: string;
    university: string;
    faculty: string | null;
    year_of_study: string;
    feedback: string | null;
    locale: string;
    user_agent: string | null;
    ip_hash: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    email: string;
    university: string;
    faculty?: string | null;
    year_of_study: string;
    feedback?: string | null;
    locale?: string;
    user_agent?: string | null;
    ip_hash?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    email?: string;
    university?: string;
    faculty?: string | null;
    year_of_study?: string;
    feedback?: string | null;
    locale?: string;
    user_agent?: string | null;
    ip_hash?: string | null;
    created_at?: string;
  };
  Relationships: [];
};
```

(If `database.types.ts` is freshly auto-generated from the migration in Task 1, this step is redundant.)

### 6b — Validation helpers (TDD)

- [ ] Write failing test `tests/unit/waitlist.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateWaitlistInput, hashIp, ALLOWED_YEARS } from '$lib/server/waitlist';

describe('validateWaitlistInput', () => {
  const valid = {
    email: 'student@example.com',
    university: 'UPB — Universitatea Politehnica',
    faculty: 'Automatica si Calculatoare',
    year_of_study: '1',
    feedback: '',
    website: '', // honeypot
  };

  it('accepts a valid submission', () => {
    const r = validateWaitlistInput(valid);
    expect(r.ok).toBe(true);
  });

  it('rejects bad email', () => {
    const r = validateWaitlistInput({ ...valid, email: 'not-an-email' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/email/i);
  });

  it('rejects empty university', () => {
    const r = validateWaitlistInput({ ...valid, university: '' });
    expect(r.ok).toBe(false);
  });

  it('rejects unknown year', () => {
    const r = validateWaitlistInput({ ...valid, year_of_study: '99' });
    expect(r.ok).toBe(false);
  });

  it('accepts pre_uni year', () => {
    const r = validateWaitlistInput({ ...valid, year_of_study: 'pre_uni' });
    expect(r.ok).toBe(true);
  });

  it('flags honeypot', () => {
    const r = validateWaitlistInput({ ...valid, website: 'http://spam.com' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.honeypotTriggered).toBe(true);
  });

  it('truncates feedback over 1000 chars', () => {
    const long = 'x'.repeat(2000);
    const r = validateWaitlistInput({ ...valid, feedback: long });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.feedback?.length).toBe(1000);
  });

  it('exposes ALLOWED_YEARS', () => {
    expect(ALLOWED_YEARS).toContain('pre_uni');
    expect(ALLOWED_YEARS).toContain('1');
    expect(ALLOWED_YEARS).toContain('6');
  });
});

describe('hashIp', () => {
  it('produces a stable hex string', async () => {
    const a = await hashIp('1.2.3.4', 'secret');
    const b = await hashIp('1.2.3.4', 'secret');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('different secrets give different hashes', async () => {
    const a = await hashIp('1.2.3.4', 's1');
    const b = await hashIp('1.2.3.4', 's2');
    expect(a).not.toBe(b);
  });
});
```

- [ ] Run, expect FAIL.

- [ ] Implement `src/lib/server/waitlist.ts`:

```ts
export const ALLOWED_YEARS = ['pre_uni', '1', '2', '3', '4', '5', '6'] as const;
export type AllowedYear = (typeof ALLOWED_YEARS)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FEEDBACK_MAX = 1000;
const FREE_TEXT_MAX = 200;

export type WaitlistInput = {
  email: string;
  university: string;
  faculty?: string;
  year_of_study: string;
  feedback?: string;
  website?: string; // honeypot
};

export type WaitlistParsed = {
  email: string;
  university: string;
  faculty: string | null;
  year_of_study: AllowedYear;
  feedback: string | null;
  honeypotTriggered: boolean;
};

export type ValidationResult =
  | { ok: true; value: WaitlistParsed }
  | { ok: false; error: string };

function pick(form: Record<string, unknown>, key: string): string {
  const v = form[key];
  if (typeof v === 'string') return v;
  return '';
}

export function validateWaitlistInput(form: Record<string, unknown>): ValidationResult {
  const email = pick(form, 'email').trim().toLowerCase();
  const university = pick(form, 'university').trim().slice(0, FREE_TEXT_MAX);
  const facultyRaw = pick(form, 'faculty').trim().slice(0, FREE_TEXT_MAX);
  const year = pick(form, 'year_of_study').trim();
  const feedbackRaw = pick(form, 'feedback');
  const website = pick(form, 'website');

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: 'Adresa de email pare invalida.' };
  }
  if (!university) {
    return { ok: false, error: 'Alege o universitate.' };
  }
  if (!(ALLOWED_YEARS as readonly string[]).includes(year)) {
    return { ok: false, error: 'Alege anul de studiu.' };
  }

  const feedback = feedbackRaw ? feedbackRaw.slice(0, FEEDBACK_MAX) : null;
  const faculty = facultyRaw ? facultyRaw : null;

  return {
    ok: true,
    value: {
      email,
      university,
      faculty,
      year_of_study: year as AllowedYear,
      feedback,
      honeypotTriggered: website.trim().length > 0,
    },
  };
}

export async function hashIp(ip: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|${secret}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

- [ ] Run tests, expect PASS.

### 6c — Form action

- [ ] Create `src/routes/+page.server.ts`:

```ts
import { fail, type Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { validateWaitlistInput, hashIp } from '$lib/server/waitlist';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export const actions: Actions = {
  waitlist: async ({ request, locals, getClientAddress, cookies }) => {
    const fd = await request.formData();
    const raw: Record<string, string> = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === 'string') raw[k] = v;
    }

    const result = validateWaitlistInput(raw);
    if (!result.ok) {
      return fail(400, { error: result.error, fields: raw });
    }
    const v = result.value;

    if (v.honeypotTriggered) {
      return { success: true, email: v.email };
    }

    const locale = cookies.get('PARAGLIDE_LOCALE') === 'en' ? 'en' : 'ro';
    const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 500);
    const ipSecret = env.IP_HASH_SECRET ?? 'dev-only-rotate-me';
    const ip = getClientAddress();
    const ip_hash = await hashIp(ip, ipSecret);

    if (env.IP_HASH_SECRET) {
      const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
      const { count } = await locals.supabase
        .from('waitlist_signups')
        .select('id', { head: true, count: 'exact' })
        .eq('ip_hash', ip_hash)
        .gte('created_at', since);
      if ((count ?? 0) >= RATE_LIMIT_MAX) {
        return fail(429, { error: 'Prea multe inregistrari. Reincearca mai tarziu.' });
      }
    }

    const { error } = await locals.supabase.from('waitlist_signups').insert({
      email: v.email,
      university: v.university,
      faculty: v.faculty,
      year_of_study: v.year_of_study,
      feedback: v.feedback,
      locale,
      user_agent: userAgent || null,
      ip_hash,
    });

    if (error && error.code !== '23505') {
      // 23505 = unique violation (duplicate email) — treat as success.
      console.error('waitlist insert failed', error);
      return fail(500, { error: 'Ceva nu a mers. Incearca din nou.' });
    }

    if (!error) {
      // Fire-and-forget Resend ping. Don't block the response.
      void sendSignupPing(v).catch((err) => console.error('resend ping failed', err));
    }

    return { success: true, email: v.email };
  },
};

async function sendSignupPing(v: {
  email: string;
  university: string;
  faculty: string | null;
  year_of_study: string;
  feedback: string | null;
}) {
  const apiKey = env.RESEND_API_KEY;
  const to = env.WAITLIST_NOTIFY_EMAIL;
  const from = env.WAITLIST_NOTIFY_FROM ?? 'Bazar <onboarding@thebazar.ro>';
  if (!apiKey || !to) return;

  const lines = [
    `Email: ${v.email}`,
    `Universitate: ${v.university}`,
    v.faculty ? `Facultate: ${v.faculty}` : null,
    `An: ${v.year_of_study}`,
    v.feedback ? `\nFeedback:\n${v.feedback}` : null,
  ].filter(Boolean);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `[Bazar] Nou pe lista: ${v.email}`,
      text: lines.join('\n'),
    }),
  });
  if (!res.ok) {
    console.error('resend non-200', await res.text());
  }
}
```

- [ ] Run tests:

```bash
npm test
```

- [ ] Commit:

```bash
git add src/lib/database.types.ts src/lib/server/waitlist.ts tests/unit/waitlist.test.ts src/routes/+page.server.ts
git commit -m "feat: waitlist form action with validation, rate-limit, and Resend ping"
```

---

## Task 7: UniversityCombobox component

**Files:**
- Create: `src/lib/components/landing/UniversityCombobox.svelte`

- [ ] Write the component (Svelte 5 runes):

```svelte
<script lang="ts">
  import { bucharestUniversities, type UniversityGroup } from '$lib/data/bucharest-universities';

  type Props = {
    university?: string;
    faculty?: string;
    placeholder?: string;
  };

  let { university = $bindable(''), faculty = $bindable(''), placeholder = 'Cauta facultatea sau universitatea' }: Props = $props();

  let open = $state(false);
  let query = $state('');
  let inputEl: HTMLInputElement | null = $state(null);
  let altaText = $state('');

  let displayLabel = $derived.by(() => {
    if (university === '__alta__') return altaText ? `Alta: ${altaText}` : 'Alta facultate';
    if (faculty) return `${faculty} — ${university}`;
    if (university) return university;
    return '';
  });

  type Item =
    | { type: 'header'; group: UniversityGroup }
    | { type: 'faculty'; group: UniversityGroup; faculty: string }
    | { type: 'alta' };

  let filtered = $derived.by<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const items: Item[] = [];
    for (const group of bucharestUniversities) {
      const groupMatches = q === '' || group.name.toLowerCase().includes(q) || (group.short ?? '').toLowerCase().includes(q);
      const matchedFaculties = q === ''
        ? group.faculties
        : group.faculties.filter((f) => f.toLowerCase().includes(q));
      if (groupMatches || matchedFaculties.length > 0) {
        items.push({ type: 'header', group });
        const facsToShow = groupMatches && matchedFaculties.length === 0 ? group.faculties : matchedFaculties;
        for (const f of facsToShow) items.push({ type: 'faculty', group, faculty: f });
      }
    }
    items.push({ type: 'alta' });
    return items;
  });

  function selectFaculty(group: UniversityGroup, fac: string) {
    university = group.name;
    faculty = fac;
    query = '';
    open = false;
  }

  function selectAlta() {
    university = '__alta__';
    faculty = '';
    query = '';
    open = false;
    setTimeout(() => document.getElementById('alta-input')?.focus(), 0);
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
      inputEl?.blur();
    }
  }

  function clear() {
    university = '';
    faculty = '';
    altaText = '';
    query = '';
    open = true;
    inputEl?.focus();
  }
</script>

<div class="relative">
  <div class="relative">
    <input
      bind:this={inputEl}
      type="text"
      class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
      {placeholder}
      value={open ? query : displayLabel}
      onfocus={() => (open = true)}
      oninput={(e) => {
        open = true;
        query = e.currentTarget.value;
        if (university && university !== '__alta__') {
          university = '';
          faculty = '';
        }
      }}
      onkeydown={handleKey}
      autocomplete="off"
    />
    {#if displayLabel && !open}
      <button
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-bazar-gray-500 hover:text-bazar-dark text-sm"
        onclick={clear}
        aria-label="Sterge"
      >×</button>
    {/if}
  </div>

  {#if open}
    <div class="absolute z-30 mt-1 w-full bg-white rounded-bazar-sm border border-bazar-gray-200 shadow-[0_8px_40px_rgba(44,47,48,0.08)] max-h-72 overflow-y-auto">
      {#each filtered as item (item.type === 'faculty' ? item.group.name + '|' + item.faculty : item.type === 'header' ? 'h:' + item.group.name : 'alta')}
        {#if item.type === 'header'}
          <div class="px-4 py-2 font-bold text-[13px] text-bazar-dark bg-bazar-offwhite sticky top-0">
            {item.group.name}
          </div>
        {:else if item.type === 'faculty'}
          <button
            type="button"
            class="w-full text-left px-6 py-2 text-[14px] text-bazar-gray-700 hover:bg-bazar-gray-100"
            onclick={() => selectFaculty(item.group, item.faculty)}
          >
            {item.faculty}
          </button>
        {:else}
          <button
            type="button"
            class="w-full text-left px-4 py-2 text-[14px] font-semibold text-bazar-dark border-t border-bazar-gray-100 hover:bg-bazar-gray-100"
            onclick={selectAlta}
          >
            Alta facultate (zi-ne care)
          </button>
        {/if}
      {/each}
    </div>
  {/if}

  {#if university === '__alta__'}
    <input
      id="alta-input"
      type="text"
      bind:value={altaText}
      class="mt-2 w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
      placeholder="Scrie aici facultatea ta"
      maxlength="200"
    />
  {/if}

  <input type="hidden" name="university" value={university === '__alta__' ? (altaText || 'Alta') : university} />
  <input type="hidden" name="faculty" value={university === '__alta__' ? '' : faculty} />
</div>

<svelte:window onclick={(e) => {
  if (!(e.target as HTMLElement)?.closest('.relative')) open = false;
}} />
```

- [ ] Manual smoke during dev server step (Task 14): typing filters, selecting fills the input, "Alta" reveals free-text, clearing resets.

- [ ] Commit:

```bash
git add src/lib/components/landing/UniversityCombobox.svelte
git commit -m "feat: searchable university combobox grouped by parent institution"
```

---

## Task 8: WaitlistForm component

**Files:**
- Create: `src/lib/components/landing/WaitlistForm.svelte`

- [ ] Write the component:

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import UniversityCombobox from './UniversityCombobox.svelte';

  type Props = {
    form?: { success?: boolean; email?: string; error?: string; fields?: Record<string, string> } | null;
  };
  let { form }: Props = $props();

  let university = $state('');
  let faculty = $state('');
  let showFeedback = $state(false);
  let submitting = $state(false);

  const years = [
    { value: 'pre_uni', label: 'Pre-universitar / liceu' },
    { value: '1', label: 'Anul 1' },
    { value: '2', label: 'Anul 2' },
    { value: '3', label: 'Anul 3' },
    { value: '4', label: 'Anul 4' },
    { value: '5', label: 'Anul 5' },
    { value: '6', label: 'Anul 6' },
  ];
</script>

<section id="waitlist" class="max-w-[640px] mx-auto px-5 md:px-8 mt-16 md:mt-20">
  <div class="bg-bazar-offwhite rounded-bazar-xl p-6 md:p-10">
    {#if form?.success}
      <div class="text-center py-6">
        <div class="text-5xl mb-3">📬</div>
        <h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">Te-am adaugat!</h2>
        <p class="text-bazar-gray-700">
          Iti scriem la <span class="font-semibold">{form.email}</span> cand lansam Bazar.
        </p>
      </div>
    {:else}
      <div class="mb-6">
        <h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">Anunta-ma cand iese Bazar.</h2>
        <p class="text-bazar-gray-700">Iti scriem o singura data, cand lansam. Fara spam.</p>
      </div>

      <form
        method="POST"
        action="?/waitlist"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            await update({ reset: false });
            submitting = false;
          };
        }}
        class="flex flex-col gap-4"
      >
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />

        <div>
          <label class="block text-sm font-semibold mb-1.5" for="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="numele.tau@email.com"
            class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
            value={form?.fields?.email ?? ''}
          />
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1.5">Universitate / facultate</label>
          <UniversityCombobox bind:university bind:faculty />
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1.5" for="year_of_study">Anul de studiu</label>
          <select
            id="year_of_study"
            name="year_of_study"
            required
            class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
          >
            <option value="">Alege anul</option>
            {#each years as y}
              <option value={y.value} selected={form?.fields?.year_of_study === y.value}>{y.label}</option>
            {/each}
          </select>
        </div>

        <label class="flex items-start gap-3 cursor-pointer mt-2 select-none">
          <input
            type="checkbox"
            bind:checked={showFeedback}
            class="mt-1 w-4 h-4 accent-bazar-dark"
          />
          <span class="text-sm text-bazar-gray-700">Vreau sa ajut sa-l facem mai bun</span>
        </label>

        {#if showFeedback}
          <div>
            <label class="block text-sm font-semibold mb-1.5" for="feedback">
              Care e partea cea mai haotica din inceputul facultatii?
            </label>
            <textarea
              id="feedback"
              name="feedback"
              rows="4"
              maxlength="1000"
              placeholder="Spune-ne orice te frustreaza, te confuzeaza, sau iti ia prea mult timp..."
              class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors resize-none"
            ></textarea>
          </div>
        {/if}

        {#if form?.error}
          <div class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-bazar-sm px-3 py-2">
            {form.error}
          </div>
        {/if}

        <button
          type="submit"
          disabled={submitting}
          class="mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark px-8 py-3.5 rounded-full font-bold text-base hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {submitting ? 'Se trimite...' : 'Trimite →'}
        </button>
      </form>
    {/if}
  </div>
</section>
```

- [ ] Commit:

```bash
git add src/lib/components/landing/WaitlistForm.svelte
git commit -m "feat: waitlist form with progressive feedback disclosure"
```

---

## Task 9: Preview components (Checklist + Q&A)

**Files:**
- Create: `src/lib/components/landing/PreviewChecklist.svelte`
- Create: `src/lib/components/landing/PreviewQA.svelte`

- [ ] Write `PreviewChecklist.svelte` — static, non-interactive, looks like the real checklist:

```svelte
<div class="bg-white rounded-bazar-xl p-5 md:p-6 shadow-[0_8px_40px_rgba(44,47,48,0.04)] pointer-events-none select-none">
  <div class="flex items-center justify-between mb-4">
    <div>
      <div class="font-heading font-bold text-lg">Checklist-ul tau</div>
      <div class="text-[12px] text-bazar-gray-500">3 din 10 completate</div>
    </div>
    <div class="text-2xl">📋</div>
  </div>
  <div class="bg-bazar-gray-100 rounded-full h-2 mb-5 overflow-hidden">
    <div class="bg-bazar-green h-full w-[30%] rounded-full"></div>
  </div>

  {#each [
    { label: 'Confirma locul la facultate', tag: 'Acte', tagClass: 'bg-blue-100 text-blue-800', done: true },
    { label: 'Depune cererea pentru camin', tag: 'Cazare', tagClass: 'bg-green-100 text-green-800', done: true },
    { label: 'Plateste taxa de inmatriculare', tag: 'Acte', tagClass: 'bg-blue-100 text-blue-800', done: true },
    { label: 'Fa-ti adeverinta medicala', tag: 'Acte', tagClass: 'bg-blue-100 text-blue-800', done: false },
    { label: 'Cauta un coleg de apartament', tag: 'Cazare', tagClass: 'bg-green-100 text-green-800', done: false },
    { label: 'Inscrie-te in grupul facultatii', tag: 'Comunitate', tagClass: 'bg-purple-100 text-purple-800', done: false },
  ] as item}
    <div class="flex items-start gap-2.5 p-3 bg-bazar-offwhite rounded-bazar-sm mb-2">
      <div class="w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center {item.done ? 'bg-bazar-green' : 'border-2 border-bazar-gray-300'}">
        {#if item.done}<span class="text-white text-[11px] font-bold">✓</span>{/if}
      </div>
      <div>
        <div class="text-[13px] font-semibold leading-tight {item.done ? 'line-through text-bazar-gray-500' : ''}">{item.label}</div>
        <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 {item.tagClass}">{item.tag}</span>
      </div>
    </div>
  {/each}
</div>
```

- [ ] Write `PreviewQA.svelte` — static, non-interactive, looks like the Q&A page:

```svelte
<div class="bg-white rounded-bazar-xl p-5 md:p-6 shadow-[0_8px_40px_rgba(44,47,48,0.04)] pointer-events-none select-none">
  <div class="flex items-center justify-between mb-4">
    <div>
      <div class="font-heading font-bold text-lg">Intrebari & Raspunsuri</div>
      <div class="text-[12px] text-bazar-gray-500">Studentii din anii mari raspund</div>
    </div>
    <div class="text-2xl">❓</div>
  </div>

  {#each [
    { q: 'Cat dureaza sa primesti loc in camin?', a: 'In medie 2-3 saptamani dupa ce depui cererea. La UPB e mai rapid.', author: 'Maria, anul 3', verified: true },
    { q: 'Ce acte iti trebuie pentru bursa sociala?', a: 'Adeverinta de venit, copie CI, dosar... lasa-ma sa-ti scriu lista completa.', author: 'Andrei, ASMI', verified: true },
    { q: 'E ok daca nu stiu inca ce specializare aleg?', a: '', author: '', verified: false },
  ] as item, i}
    <div class="border-b border-bazar-gray-100 last:border-0 py-3">
      <div class="font-semibold text-[14px] mb-1">{item.q}</div>
      {#if item.a}
        <div class="bg-bazar-offwhite rounded-bazar-sm p-3 mt-2 {item.verified ? 'border-l-4 border-bazar-yellow' : ''}">
          <div class="text-[13px] text-bazar-gray-700 mb-2">{item.a}</div>
          <div class="flex items-center gap-2 text-[11px] text-bazar-gray-500">
            <span class="font-semibold">{item.author}</span>
            {#if item.verified}
              <span class="px-1.5 py-0.5 bg-bazar-yellow rounded-full text-bazar-dark font-bold">verificat</span>
            {/if}
          </div>
        </div>
      {:else}
        <div class="text-[12px] text-bazar-gray-500 italic">Astepta raspuns...</div>
      {/if}
    </div>
  {/each}
</div>
```

- [ ] Commit:

```bash
git add src/lib/components/landing/PreviewChecklist.svelte src/lib/components/landing/PreviewQA.svelte
git commit -m "feat: static preview components for checklist and Q&A"
```

---

## Task 10: Rewrite landing page (Romanian-hardcoded first)

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] Replace the contents of `src/routes/+page.svelte` with the new structure. Strings stay in Romanian for now — i18n extraction happens in Task 12.

```svelte
<script lang="ts">
  import WaitlistForm from '$lib/components/landing/WaitlistForm.svelte';
  import PreviewChecklist from '$lib/components/landing/PreviewChecklist.svelte';
  import PreviewQA from '$lib/components/landing/PreviewQA.svelte';

  let { form } = $props();
</script>

<svelte:head>
  <title>Bazar — facultatea, fara haos</title>
  <meta name="description" content="Checklist, comunitate, raspunsuri. Aplicatia care iti pune ordine in inceputul facultatii. Aboneaza-te sa fii anuntat la lansare." />
</svelte:head>

<nav class="flex justify-between items-center px-5 py-4 md:px-8 max-w-[1200px] mx-auto">
  <a href="/" class="font-heading font-bold text-[28px] tracking-tight text-bazar-dark no-underline">
    ba<span class="inline-block bg-bazar-yellow px-2 py-0.5 rounded-md -rotate-2 ml-0.5">zar</span>
  </a>
  <div class="flex gap-3 items-center">
    <a href="#features" class="hidden md:inline-block text-bazar-gray-700 text-[15px] font-medium px-4 py-2 rounded-bazar-sm hover:bg-bazar-gray-100 transition-colors no-underline">
      Cum functioneaza
    </a>
    <a href="#preview" class="hidden md:inline-block text-bazar-gray-700 text-[15px] font-medium px-4 py-2 rounded-bazar-sm hover:bg-bazar-gray-100 transition-colors no-underline">
      Vezi cum arata
    </a>
    <a href="#waitlist" class="bg-bazar-yellow text-bazar-dark font-semibold text-[15px] px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform no-underline">
      Aboneaza-te
    </a>
  </div>
</nav>

<!-- Hero -->
<section class="max-w-[1200px] mx-auto px-5 md:px-8 pt-8 md:pt-16 pb-10 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
  <div>
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bazar-yellow/40 text-bazar-dark text-[13px] font-semibold mb-4">
      <span class="w-2 h-2 rounded-full bg-bazar-dark animate-pulse"></span>
      Lansare in vara 2026
    </div>
    <h1 class="font-heading font-bold text-4xl md:text-[56px] leading-[1.1] tracking-tight mb-5">
      Inceputul facultatii
      <br />
      e <span class="inline-block bg-bazar-yellow px-2 py-0.5 rounded-md -rotate-1">haos.</span>
      <br />
      <span class="text-bazar-gray-500">Noi punem ordine.</span>
    </h1>
    <p class="text-lg text-bazar-gray-700 leading-relaxed mb-8 max-w-[460px]">
      Checklist-uri, raspunsuri la intrebari stupide, comunitate — totul intr-un singur loc. Facut de studenti, pentru studenti.
    </p>
    <div class="flex gap-3 flex-wrap">
      <a href="#waitlist" class="inline-flex items-center gap-2 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark px-8 py-3.5 rounded-full font-bold text-base no-underline hover:-translate-y-0.5 hover:shadow-lg transition-all">
        Anunta-ma cand iese →
      </a>
      <a href="#preview" class="inline-flex items-center gap-2 bg-bazar-gray-100 text-bazar-gray-700 px-6 py-3.5 rounded-full font-medium text-base no-underline hover:bg-bazar-gray-200 hover:text-bazar-dark transition-all">
        Vezi cum arata
      </a>
    </div>
  </div>

  <div class="relative order-first md:order-last overflow-hidden md:overflow-visible">
    <span class="absolute -top-2.5 left-0 md:-left-5 text-[28px] md:text-[32px] -rotate-[15deg] drop-shadow-md z-10">📋</span>
    <span class="absolute top-10 right-0 md:-right-7 text-[28px] md:text-[32px] rotate-[10deg] drop-shadow-md z-10">💬</span>
    <span class="absolute bottom-10 left-0 md:-left-7 text-[28px] md:text-[32px] rotate-[8deg] drop-shadow-md z-10">❓</span>

    <div class="bg-white rounded-[32px] p-4 shadow-[0_8px_60px_rgba(44,47,48,0.06)] max-w-[280px] md:max-w-[340px] mx-auto rotate-2 md:rotate-2">
      <div class="bg-bazar-offwhite rounded-[20px] p-4 md:p-5 min-h-[380px] md:min-h-[460px]">
        <div class="font-heading font-bold text-xl mb-1">Checklist-ul tau</div>
        <div class="text-[13px] text-bazar-gray-500 mb-4">0 din 10 completate</div>
        <div class="bg-bazar-gray-100 rounded-full h-2 mb-5 overflow-hidden">
          <div class="bg-bazar-green h-full w-[0%] rounded-full"></div>
        </div>
        <div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
          <div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
          <div>
            <div class="text-[13px] font-semibold leading-tight">Confirma locul la facultate</div>
            <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-blue-100 text-blue-800">Acte</span>
          </div>
        </div>
        <div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
          <div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
          <div>
            <div class="text-[13px] font-semibold leading-tight">Depune cererea pentru camin</div>
            <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-green-100 text-green-800">Cazare</span>
          </div>
        </div>
        <div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
          <div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
          <div>
            <div class="text-[13px] font-semibold leading-tight">Plateste taxa de inmatriculare</div>
            <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-blue-100 text-blue-800">Acte</span>
          </div>
        </div>
        <div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
          <div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
          <div>
            <div class="text-[13px] font-semibold leading-tight">Fa-ti adeverinta medicala</div>
            <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-blue-100 text-blue-800">Acte</span>
          </div>
        </div>
        <div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
          <div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
          <div>
            <div class="text-[13px] font-semibold leading-tight">Exploreaza campusul</div>
            <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-amber-100 text-amber-800">Campus</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Features bento (no roommates) -->
<section id="features" class="max-w-[1200px] mx-auto px-5 md:px-8 mt-10 flex flex-col gap-4">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="md:col-span-2 bg-white rounded-bazar-xl p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(44,47,48,0.06)] transition-all">
      <div class="w-12 h-12 rounded-bazar-sm bg-amber-100 flex items-center justify-center text-2xl mb-4">📋</div>
      <h3 class="font-heading font-bold text-xl mb-2">Checklist pas cu pas</h3>
      <p class="text-sm text-bazar-gray-500 leading-relaxed mb-4">Toate deadline-urile si actele de care ai nevoie, intr-o lista simpla. Bifezi, avansezi, nu ratezi nimic.</p>
      <div class="flex gap-2 flex-wrap">
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700">Acte</span>
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700">Cazare</span>
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700">Inregistrare</span>
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700">Campus</span>
      </div>
    </div>
    <div class="bg-bazar-dark rounded-bazar-xl p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(44,47,48,0.06)] transition-all flex flex-col justify-between">
      <div>
        <div class="w-12 h-12 rounded-bazar-sm bg-white/10 flex items-center justify-center text-2xl mb-4">💬</div>
        <h3 class="font-heading font-bold text-xl text-white mb-2">Comunitate</h3>
        <p class="text-sm text-white/60 leading-relaxed">Grupuri pe facultate. Cunoaste-ti colegii inainte sa inceapa cursurile.</p>
      </div>
    </div>
  </div>

  <div class="bg-bazar-yellow rounded-bazar-xl p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(44,47,48,0.06)] transition-all grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
    <div>
      <div class="w-12 h-12 rounded-bazar-sm bg-bazar-dark/10 flex items-center justify-center text-2xl mb-4">❓</div>
      <h3 class="font-heading font-bold text-xl text-bazar-dark mb-2">Intreaba orice. Fara intrebari stupide.</h3>
      <p class="text-sm text-bazar-dark/70 leading-relaxed">Pune intrebarea. Studentii din anii mari si reprezentantii de an raspund. Raspunsurile verificate apar evidentiate.</p>
    </div>
    <div class="flex items-center justify-center md:justify-end">
      <div class="bg-white rounded-bazar-sm px-4 py-3 shadow-sm rotate-1 max-w-[260px]">
        <div class="text-[13px] font-semibold mb-1">"Cat dureaza sa primesti loc in camin?"</div>
        <div class="text-[11px] text-bazar-gray-500 italic">Maria, anul 3 · verificat ✓</div>
      </div>
    </div>
  </div>
</section>

<!-- Preview section -->
<section id="preview" class="max-w-[1200px] mx-auto px-5 md:px-8 mt-16 md:mt-20">
  <div class="text-center mb-8">
    <h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">Asa va arata cand lansam.</h2>
    <p class="text-bazar-gray-700">Un mic preview din interiorul aplicatiei.</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 max-w-[900px] mx-auto">
    <PreviewChecklist />
    <PreviewQA />
  </div>
</section>

<!-- Social proof -->
<section class="max-w-[1200px] mx-auto px-5 md:px-8 mt-16 text-center">
  <p class="text-sm text-bazar-gray-500 font-medium mb-5">Construim primul pentru studentii de la:</p>
  <div class="flex justify-center gap-4 md:gap-8 flex-wrap">
    <div class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700">
      <span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> UPB — Politehnica
    </div>
    <div class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700">
      <span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> ASE
    </div>
    <div class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700">
      <span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> Universitatea din Bucuresti
    </div>
  </div>
</section>

<!-- Waitlist form -->
<WaitlistForm {form} />

<!-- Bottom CTA -->
<section class="relative overflow-hidden bg-bazar-dark rounded-[20px] md:rounded-[28px] mx-4 md:mx-8 max-w-[1136px] lg:mx-auto mt-12 md:mt-20 mb-12 md:mb-16 px-5 md:px-8 py-10 md:py-12 text-center">
  <div class="absolute -top-1/2 -right-[20%] w-[300px] h-[300px] bg-bazar-purple opacity-15 rounded-full blur-[60px]"></div>
  <div class="absolute -bottom-[30%] -left-[10%] w-[250px] h-[250px] bg-bazar-yellow opacity-12 rounded-full blur-[60px]"></div>
  <h2 class="font-heading font-bold text-3xl md:text-4xl text-white mb-3 relative z-10">Gata cu panica de boboc.</h2>
  <p class="text-white/60 text-base mb-7 relative z-10">Lasa-ne emailul si te anuntam cand iese.</p>
  <a href="#waitlist" class="relative z-10 inline-flex items-center gap-2 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark px-8 py-3.5 rounded-full font-bold text-base no-underline hover:-translate-y-0.5 transition-transform">
    Aboneaza-te →
  </a>
</section>

<footer class="text-center px-5 md:px-8 pb-10 pt-6 text-[13px] text-bazar-gray-500">
  Bazar &copy; 2026 &middot; Facut cu nervi si cafea in Bucuresti
</footer>
```

- [ ] Start dev server and visit `/`. Verify hero, features (no roommates), preview cards, social proof, waitlist form, bottom CTA all render. Submit a test signup with a fake email — confirm thank-you state appears.

```bash
PUBLIC_LAUNCH_MODE=prelaunch PRELAUNCH_BYPASS_TOKEN=devtoken IP_HASH_SECRET=devsecret npm run dev
```

- [ ] Commit:

```bash
git add src/routes/+page.svelte
git commit -m "feat: pre-launch landing page structure (RO-only first pass)"
```

---

## Task 11: Paraglide install + init

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `project.inlang/settings.json`, `messages/ro.json`, `messages/en.json`
- Generated: `src/lib/paraglide/`

- [ ] Verify against current Paraglide docs first (the API has shifted between releases). Use context7 with library id for `@inlang/paraglide-js` if available; otherwise fall back to `https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit`.

- [ ] Install:

```bash
npm install -D @inlang/paraglide-js
```

- [ ] Initialize:

```bash
npx @inlang/paraglide-js init --outdir src/lib/paraglide
```

When prompted: source locale `ro`, target locale `en`. The init command creates `project.inlang/`, the `messages/` directory, and updates `vite.config.ts` automatically.

- [ ] Verify `vite.config.ts` now includes the `paraglideVitePlugin`. If not, add it manually:

```ts
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      strategy: ['cookie', 'baseLocale'],
      cookieName: 'PARAGLIDE_LOCALE',
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] Run dev server briefly to ensure Paraglide generated `src/lib/paraglide/messages.js` (or `.ts`). Stop the server.

- [ ] Add generated paraglide directory to git:

```bash
git add package.json package-lock.json vite.config.ts project.inlang messages src/lib/paraglide
git commit -m "feat: install Paraglide JS for ro/en i18n"
```

---

## Task 12: Extract landing strings into Paraglide messages

**Files:**
- Modify: `messages/ro.json`, `messages/en.json`
- Modify: `src/routes/+page.svelte`, `src/lib/components/landing/WaitlistForm.svelte`, `src/lib/components/landing/PreviewChecklist.svelte`, `src/lib/components/landing/PreviewQA.svelte`

- [ ] Populate `messages/ro.json` with all landing strings. Keys grouped by section:

```json
{
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "nav_features": "Cum functioneaza",
  "nav_preview": "Vezi cum arata",
  "nav_subscribe": "Aboneaza-te",

  "hero_tag": "Lansare in vara 2026",
  "hero_title_part1": "Inceputul facultatii",
  "hero_title_e": "e",
  "hero_title_haos": "haos.",
  "hero_title_punemordine": "Noi punem ordine.",
  "hero_subtitle": "Checklist-uri, raspunsuri la intrebari stupide, comunitate — totul intr-un singur loc. Facut de studenti, pentru studenti.",
  "hero_cta_primary": "Anunta-ma cand iese",
  "hero_cta_secondary": "Vezi cum arata",

  "features_checklist_title": "Checklist pas cu pas",
  "features_checklist_desc": "Toate deadline-urile si actele de care ai nevoie, intr-o lista simpla. Bifezi, avansezi, nu ratezi nimic.",
  "features_tag_acte": "Acte",
  "features_tag_cazare": "Cazare",
  "features_tag_inregistrare": "Inregistrare",
  "features_tag_campus": "Campus",
  "features_community_title": "Comunitate",
  "features_community_desc": "Grupuri pe facultate. Cunoaste-ti colegii inainte sa inceapa cursurile.",
  "features_qa_title": "Intreaba orice. Fara intrebari stupide.",
  "features_qa_desc": "Pune intrebarea. Studentii din anii mari si reprezentantii de an raspund. Raspunsurile verificate apar evidentiate.",
  "features_qa_quote": "\"Cat dureaza sa primesti loc in camin?\"",
  "features_qa_author": "Maria, anul 3 · verificat ✓",

  "preview_heading": "Asa va arata cand lansam.",
  "preview_subtitle": "Un mic preview din interiorul aplicatiei.",
  "preview_checklist_title": "Checklist-ul tau",
  "preview_checklist_progress": "3 din 10 completate",
  "preview_checklist_item1": "Confirma locul la facultate",
  "preview_checklist_item2": "Depune cererea pentru camin",
  "preview_checklist_item3": "Plateste taxa de inmatriculare",
  "preview_checklist_item4": "Fa-ti adeverinta medicala",
  "preview_checklist_item5": "Cauta un coleg de apartament",
  "preview_checklist_item6": "Inscrie-te in grupul facultatii",
  "preview_qa_title": "Intrebari & Raspunsuri",
  "preview_qa_subtitle": "Studentii din anii mari raspund",
  "preview_qa_q1": "Cat dureaza sa primesti loc in camin?",
  "preview_qa_a1": "In medie 2-3 saptamani dupa ce depui cererea. La UPB e mai rapid.",
  "preview_qa_author1": "Maria, anul 3",
  "preview_qa_q2": "Ce acte iti trebuie pentru bursa sociala?",
  "preview_qa_a2": "Adeverinta de venit, copie CI, dosar... lasa-ma sa-ti scriu lista completa.",
  "preview_qa_author2": "Andrei, ASMI",
  "preview_qa_q3": "E ok daca nu stiu inca ce specializare aleg?",
  "preview_qa_pending": "Astepta raspuns...",
  "preview_qa_verified": "verificat",

  "social_proof_heading": "Construim primul pentru studentii de la:",

  "waitlist_heading": "Anunta-ma cand iese Bazar.",
  "waitlist_subtitle": "Iti scriem o singura data, cand lansam. Fara spam.",
  "waitlist_email_label": "Email",
  "waitlist_email_placeholder": "numele.tau@email.com",
  "waitlist_university_label": "Universitate / facultate",
  "waitlist_university_placeholder": "Cauta facultatea sau universitatea",
  "waitlist_year_label": "Anul de studiu",
  "waitlist_year_placeholder": "Alege anul",
  "waitlist_year_pre_uni": "Pre-universitar / liceu",
  "waitlist_year_1": "Anul 1",
  "waitlist_year_2": "Anul 2",
  "waitlist_year_3": "Anul 3",
  "waitlist_year_4": "Anul 4",
  "waitlist_year_5": "Anul 5",
  "waitlist_year_6": "Anul 6",
  "waitlist_feedback_checkbox": "Vreau sa ajut sa-l facem mai bun",
  "waitlist_feedback_label": "Care e partea cea mai haotica din inceputul facultatii?",
  "waitlist_feedback_placeholder": "Spune-ne orice te frustreaza, te confuzeaza, sau iti ia prea mult timp...",
  "waitlist_alta_placeholder": "Scrie aici facultatea ta",
  "waitlist_alta_option": "Alta facultate (zi-ne care)",
  "waitlist_submit": "Trimite",
  "waitlist_submitting": "Se trimite...",
  "waitlist_success_title": "Te-am adaugat!",
  "waitlist_success_body": "Iti scriem la {email} cand lansam Bazar.",

  "bottom_cta_title": "Gata cu panica de boboc.",
  "bottom_cta_subtitle": "Lasa-ne emailul si te anuntam cand iese.",
  "bottom_cta_button": "Aboneaza-te",

  "footer_text": "Bazar © 2026 · Facut cu nervi si cafea in Bucuresti",

  "head_title": "Bazar — facultatea, fara haos",
  "head_description": "Checklist, comunitate, raspunsuri. Aplicatia care iti pune ordine in inceputul facultatii. Aboneaza-te sa fii anuntat la lansare."
}
```

- [ ] Populate `messages/en.json` with English translations of every key:

```json
{
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "nav_features": "How it works",
  "nav_preview": "See it",
  "nav_subscribe": "Subscribe",

  "hero_tag": "Launching summer 2026",
  "hero_title_part1": "Starting university",
  "hero_title_e": "is",
  "hero_title_haos": "chaos.",
  "hero_title_punemordine": "We sort it.",
  "hero_subtitle": "Checklists, answers to dumb questions, community — all in one place. Built by students, for students.",
  "hero_cta_primary": "Tell me when it's out",
  "hero_cta_secondary": "See it",

  "features_checklist_title": "Step-by-step checklist",
  "features_checklist_desc": "Every deadline and document you need, in one simple list. Tick off, move on, miss nothing.",
  "features_tag_acte": "Documents",
  "features_tag_cazare": "Housing",
  "features_tag_inregistrare": "Registration",
  "features_tag_campus": "Campus",
  "features_community_title": "Community",
  "features_community_desc": "Faculty-specific groups. Meet your peers before classes start.",
  "features_qa_title": "Ask anything. No dumb questions.",
  "features_qa_desc": "Drop your question. Senior students and class reps answer. Verified answers stand out.",
  "features_qa_quote": "\"How long does it take to get a dorm room?\"",
  "features_qa_author": "Maria, year 3 · verified ✓",

  "preview_heading": "Here's how it'll look at launch.",
  "preview_subtitle": "A small preview of the app.",
  "preview_checklist_title": "Your checklist",
  "preview_checklist_progress": "3 of 10 done",
  "preview_checklist_item1": "Confirm your university spot",
  "preview_checklist_item2": "Apply for dorm housing",
  "preview_checklist_item3": "Pay the enrollment fee",
  "preview_checklist_item4": "Get your medical certificate",
  "preview_checklist_item5": "Find a flatmate",
  "preview_checklist_item6": "Join your faculty group",
  "preview_qa_title": "Questions & Answers",
  "preview_qa_subtitle": "Senior students answer",
  "preview_qa_q1": "How long does it take to get a dorm room?",
  "preview_qa_a1": "Usually 2-3 weeks after you apply. At UPB it's faster.",
  "preview_qa_author1": "Maria, year 3",
  "preview_qa_q2": "What do I need for a needs-based scholarship?",
  "preview_qa_a2": "Income certificate, ID copy, file... let me write out the full list.",
  "preview_qa_author2": "Andrei, ASMI",
  "preview_qa_q3": "Is it ok if I don't know my specialization yet?",
  "preview_qa_pending": "Waiting for an answer...",
  "preview_qa_verified": "verified",

  "social_proof_heading": "Building first for students from:",

  "waitlist_heading": "Tell me when Bazar launches.",
  "waitlist_subtitle": "We email you exactly once — at launch. No spam.",
  "waitlist_email_label": "Email",
  "waitlist_email_placeholder": "your.name@email.com",
  "waitlist_university_label": "University / faculty",
  "waitlist_university_placeholder": "Search for your faculty or university",
  "waitlist_year_label": "Year of study",
  "waitlist_year_placeholder": "Pick a year",
  "waitlist_year_pre_uni": "High school / pre-university",
  "waitlist_year_1": "Year 1",
  "waitlist_year_2": "Year 2",
  "waitlist_year_3": "Year 3",
  "waitlist_year_4": "Year 4",
  "waitlist_year_5": "Year 5",
  "waitlist_year_6": "Year 6",
  "waitlist_feedback_checkbox": "I want to help make it better",
  "waitlist_feedback_label": "What's the most chaotic part of starting university?",
  "waitlist_feedback_placeholder": "Tell us anything that frustrates, confuses, or wastes your time...",
  "waitlist_alta_placeholder": "Type your faculty here",
  "waitlist_alta_option": "Other faculty (tell us which)",
  "waitlist_submit": "Send",
  "waitlist_submitting": "Sending...",
  "waitlist_success_title": "You're on the list!",
  "waitlist_success_body": "We'll email {email} when Bazar launches.",

  "bottom_cta_title": "No more first-year panic.",
  "bottom_cta_subtitle": "Drop your email and we'll tell you at launch.",
  "bottom_cta_button": "Subscribe",

  "footer_text": "Bazar © 2026 · Made with caffeine and stress in Bucharest",

  "head_title": "Bazar — university, without the chaos",
  "head_description": "Checklists, community, answers. The app that brings order to your first university year. Subscribe to be notified at launch."
}
```

- [ ] Replace hardcoded Romanian strings in `src/routes/+page.svelte` with calls to `m.<key>()`. Pattern:

```svelte
<script lang="ts">
  import * as m from '$lib/paraglide/messages';
  // ...
</script>

<svelte:head>
  <title>{m.head_title()}</title>
  <meta name="description" content={m.head_description()} />
</svelte:head>

<a href="#features">{m.nav_features()}</a>
<!-- etc. for every visible string -->
```

For interpolation (the `{email}` placeholder in `waitlist_success_body`), use `m.waitlist_success_body({ email: form.email })`.

- [ ] Replace strings in `WaitlistForm.svelte`, `PreviewChecklist.svelte`, `PreviewQA.svelte` similarly.

- [ ] Run dev server, confirm RO renders identically.

- [ ] Commit:

```bash
git add messages src/routes/+page.svelte src/lib/components/landing
git commit -m "feat: extract landing strings into Paraglide messages"
```

---

## Task 13: Locale toggle endpoint + nav UI + hook integration

**Files:**
- Create: `src/routes/api/locale/+server.ts`
- Modify: `src/routes/+page.svelte` (add `RO | EN` toggle in nav)
- Modify: `src/hooks.server.ts` (set request locale from cookie)
- Modify: `src/routes/+layout.svelte` (set `<html lang>`)

- [ ] Create `src/routes/api/locale/+server.ts`:

```ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED = new Set(['ro', 'en']);

export const GET: RequestHandler = ({ url, cookies }) => {
  const to = url.searchParams.get('to') ?? 'ro';
  const redirectTo = url.searchParams.get('redirect') ?? '/';
  if (!ALLOWED.has(to)) throw redirect(302, redirectTo);

  cookies.set('PARAGLIDE_LOCALE', to, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  // Only allow same-origin redirects.
  const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
  throw redirect(302, safeRedirect);
};
```

- [ ] Modify `src/routes/+page.svelte` nav block to include the toggle. Add inside the `<div class="flex gap-3 items-center">`:

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { getLocale } from '$lib/paraglide/runtime';
  // ... existing imports
</script>

<!-- inside nav, after the Aboneaza-te button -->
{@const currentLocale = getLocale()}
<div class="flex items-center gap-1 bg-white rounded-full px-1 py-1 text-[12px] font-bold ml-2">
  <a
    href={`/api/locale?to=ro&redirect=${encodeURIComponent(page.url.pathname + page.url.search + page.url.hash)}`}
    class="px-2 py-1 rounded-full no-underline {currentLocale === 'ro' ? 'bg-bazar-dark text-white' : 'text-bazar-gray-500'}"
  >RO</a>
  <a
    href={`/api/locale?to=en&redirect=${encodeURIComponent(page.url.pathname + page.url.search + page.url.hash)}`}
    class="px-2 py-1 rounded-full no-underline {currentLocale === 'en' ? 'bg-bazar-dark text-white' : 'text-bazar-gray-500'}"
  >EN</a>
</div>
```

- [ ] Modify `src/routes/+layout.svelte` to set `<html lang>`. Read current file first if it exists; expected addition:

```svelte
<script lang="ts">
  import { getLocale } from '$lib/paraglide/runtime';
  let { children } = $props();
</script>

<svelte:head>
  <html lang={getLocale()} />
</svelte:head>

{@render children?.()}
```

(Keep any existing layout content; integrate the lang attribute via Svelte's `<svelte:head>` or a `+layout.server.ts` `load`. If Paraglide's SvelteKit integration sets this automatically per its docs, skip.)

- [ ] Verify the hook locale handling. Paraglide's Vite plugin reads the cookie automatically when using `strategy: ['cookie']`. If extra hook code is required by the current Paraglide version, follow its docs. As a fallback, in `src/hooks.server.ts` add inside `prelaunchHandle` (or a new handle in the sequence) before `resolve(event)`:

```ts
import { setLocale, isLocale } from '$lib/paraglide/runtime';
// ...
const cookieLocale = event.cookies.get('PARAGLIDE_LOCALE');
if (cookieLocale && isLocale(cookieLocale)) {
  setLocale(cookieLocale, { reload: false });
}
```

- [ ] Test in dev:
  - Visit `/` → RO renders, RO pill highlighted.
  - Click EN pill → page reloads in English, EN pill highlighted, cookie set.
  - Refresh → still EN.
  - Click RO → back to Romanian.

- [ ] Commit:

```bash
git add src/routes/api/locale/+server.ts src/routes/+page.svelte src/routes/+layout.svelte src/hooks.server.ts
git commit -m "feat: RO/EN locale toggle in nav with cookie persistence"
```

---

## Task 14: End-to-end verification

- [ ] Start dev with the prelaunch env:

```bash
PUBLIC_LAUNCH_MODE=prelaunch \
PRELAUNCH_BYPASS_TOKEN=devtoken123 \
IP_HASH_SECRET=devsecret \
RESEND_API_KEY=$YOUR_RESEND_KEY \
WAITLIST_NOTIFY_EMAIL=ciobotarasu.vlad@protonmail.com \
WAITLIST_NOTIFY_FROM='Bazar <onboarding@thebazar.ro>' \
npm run dev
```

(Resend env vars optional for the smoke test — if absent, the ping is silently skipped.)

- [ ] Verify gate:
  - Visit `/login`, `/register`, `/checklist`, `/qa`, `/admin` → all redirect to `/`.
  - Visit `/__admin?token=wrong` → 404.
  - Visit `/__admin?token=devtoken123` → redirected to `/admin`. Browser back, verify all app routes now reachable.
  - Clear `bazar_admin_bypass` cookie, refresh — back to gated.

- [ ] Verify landing:
  - Hero, features (no roommates), preview cards, social proof, waitlist form, bottom CTA, footer all render.
  - "Aboneaza-te" CTA scrolls to form.
  - "Vezi cum arata" scrolls to preview.

- [ ] Verify form:
  - University combobox: type "auto" → should filter UPB's "Automatica si Calculatoare" and others.
  - Pick a faculty — the input shows it.
  - Click "Alta facultate" → free-text input appears.
  - Submit valid signup → success state shows your email.
  - Verify row landed in Supabase (`select * from waitlist_signups order by created_at desc limit 3` via dashboard).
  - Submit again with same email → still shows success (no error leak), no duplicate row.
  - If Resend env set, check inbox for `[Bazar] Nou pe lista: ...` email.

- [ ] Verify i18n:
  - RO/EN toggle changes the entire page.
  - Cookie persists across reloads.

- [ ] Mobile viewport check (Chrome DevTools 375px width): hero stacks correctly, preview cards stack, form usable, nav doesn't overflow.

- [ ] Run lint, typecheck, tests:

```bash
npm run lint && npm run check && npm test
```

- [ ] If all green, final tidy commit (if any uncommitted changes):

```bash
git status
# if needed:
git add -A && git commit -m "chore: post-verification fixes"
```

---

## Self-review

- **Spec coverage:**
  - Routing & access control (spec §3) → Tasks 3, 4, 5 ✓
  - i18n setup (spec §4) → Tasks 11, 12, 13 ✓
  - Landing structure (spec §5) → Tasks 9, 10 ✓
  - Waitlist form (spec §6) → Tasks 7, 8 ✓
  - Data layer (spec §7) → Tasks 1, 6 ✓
  - University data → Task 2 ✓
  - Resend ping → Task 6 ✓
  - Honeypot + rate limit → Task 6 ✓

- **Placeholders:** none. All steps have concrete code or commands.

- **Type consistency:** `BYPASS_COOKIE_NAME` referenced in both prelaunch.ts and hooks.server.ts. `validateWaitlistInput`, `hashIp`, `ALLOWED_YEARS` consistent across files. Form action expects fields produced by the form (`email`, `university`, `faculty`, `year_of_study`, `feedback`, `website`).

- **Risks called out in spec are honored:**
  - Paraglide install variability → Task 11 explicitly verifies docs first.
  - Cookie signing on Cloudflare → uses Web Crypto, no Node-only API.
  - University data completeness → "Alta facultate" path covered.

---

## Env vars to set in Cloudflare Pages before deploying live

- `PUBLIC_LAUNCH_MODE=prelaunch`
- `PRELAUNCH_BYPASS_TOKEN=<long random string>`
- `IP_HASH_SECRET=<long random string>`
- `RESEND_API_KEY=<existing>`
- `WAITLIST_NOTIFY_EMAIL=ciobotarasu.vlad@protonmail.com`
- `WAITLIST_NOTIFY_FROM=Bazar <onboarding@thebazar.ro>` (or whatever Resend-verified sender is preferred)

To go live: change `PUBLIC_LAUNCH_MODE` to `live` and redeploy.
