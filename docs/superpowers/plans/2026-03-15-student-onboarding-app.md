# UniStart — Student Onboarding & Roommate App

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive web app that helps incoming university students in Bucharest navigate onboarding (checklist of deadlines & tasks), find compatible roommates, discover other students in their faculty, and get answers from upperclassmen.

**Architecture:** SvelteKit web app deployed to Cloudflare Pages, with Supabase backend (auth, PostgreSQL, realtime subscriptions for chat, storage for avatars). The app is organized into 5 core modules: Auth, Checklist, People/Roommates, Messaging, and Q&A. Server-side logic uses SvelteKit server routes (`+page.server.ts`) and Supabase Edge Functions where needed. Content (checklist items, university info) is stored in the database and seeded via SQL.

**Tech Stack:**
- **Framework:** SvelteKit + TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn-svelte (Bits UI primitives + Tailwind)
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Deployment:** Cloudflare Pages (frontend) + Supabase Cloud (backend)
- **Repo:** GitHub
- **Testing:** Vitest (unit) + Playwright (e2e)
- **CI:** GitHub Actions (lint + test + deploy on push to main)

---

## Project Structure

```
reroute/
├── src/
│   ├── routes/                        # SvelteKit file-based routing
│   │   ├── +layout.svelte             # Root layout (nav, auth guard)
│   │   ├── +layout.server.ts          # Root server layout (load session)
│   │   ├── +page.svelte               # Landing / redirect
│   │   ├── (auth)/                    # Auth group (no nav bar)
│   │   │   ├── +layout.svelte
│   │   │   ├── login/+page.svelte
│   │   │   ├── register/+page.svelte
│   │   │   ├── verify-email/+page.svelte
│   │   │   └── setup-profile/+page.svelte
│   │   ├── (app)/                     # Main app group (has nav bar)
│   │   │   ├── +layout.svelte
│   │   │   ├── checklist/
│   │   │   │   ├── +page.svelte       # Onboarding checklist
│   │   │   │   └── +page.server.ts
│   │   │   ├── people/
│   │   │   │   ├── +page.svelte       # Browse people / roommate search
│   │   │   │   ├── +page.server.ts
│   │   │   │   └── [id]/+page.svelte  # View someone's profile
│   │   │   ├── messages/
│   │   │   │   ├── +page.svelte       # Conversations list
│   │   │   │   └── [id]/+page.svelte  # Chat screen
│   │   │   ├── qa/
│   │   │   │   ├── +page.svelte       # Q&A board
│   │   │   │   ├── ask/+page.svelte   # Ask a question
│   │   │   │   └── [id]/+page.svelte  # Question + answers
│   │   │   ├── quiz/+page.svelte      # Lifestyle quiz
│   │   │   └── profile/
│   │   │       ├── +page.svelte       # Own profile / settings
│   │   │       └── +page.server.ts
│   │   └── api/                       # API routes (if needed)
│   │       └── conversations/+server.ts
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client (browser)
│   │   ├── supabase-server.ts        # Supabase client (server)
│   │   ├── matching.ts               # Compatibility score calculation
│   │   ├── types.ts                  # Shared TypeScript types
│   │   └── constants.ts             # Quiz questions, sectors, etc.
│   ├── components/
│   │   ├── ChecklistItem.svelte
│   │   ├── ProfileCard.svelte
│   │   ├── CompatibilityBadge.svelte
│   │   ├── QuestionCard.svelte
│   │   ├── MessageBubble.svelte
│   │   ├── FilterDrawer.svelte
│   │   └── NavBar.svelte
│   └── app.css                       # Tailwind imports + global styles
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   ├── seed.sql
│   └── config.toml
├── tests/
│   ├── unit/
│   │   └── matching.test.ts
│   └── e2e/
│       └── auth.test.ts
├── static/                           # Static assets
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
├── wrangler.toml                     # Cloudflare Pages config
└── .env.local                        # Supabase URL + anon key (gitignored)
```

---

## Database Schema

```sql
-- Universities & faculties (seeded)
create table universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  email_domain text
);

create table faculties (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id),
  name text not null,
  short_name text not null
);

-- User profiles
create table profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  full_name text not null,
  avatar_url text,
  bio text,
  faculty_id uuid references faculties(id),
  year smallint default 1,
  home_city text,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Lifestyle quiz answers (for compatibility matching)
create table quiz_answers (
  profile_id uuid primary key references profiles(id),
  sleep_schedule smallint,       -- 1=early bird ... 5=night owl
  cleanliness smallint,          -- 1=relaxed ... 5=spotless
  noise_tolerance smallint,      -- 1=silence ... 5=noisy is fine
  guests_frequency smallint,     -- 1=never ... 5=often
  smoking smallint,              -- 0=no, 1=outside only, 2=yes
  pets smallint,                 -- 0=no, 1=yes
  study_vs_social smallint,      -- 1=mostly study ... 5=mostly social
  updated_at timestamptz default now()
);

-- Roommate preferences
create table roommate_preferences (
  profile_id uuid primary key references profiles(id),
  budget_min integer,
  budget_max integer,
  preferred_sectors text[],
  move_in_month text,
  gender_preference text default 'any',
  has_apartment boolean default false,
  apartment_link text,
  looking_for_count smallint default 1,
  updated_at timestamptz default now()
);

-- Onboarding checklist templates (per university, seeded)
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id),
  title text not null,
  description text,
  category text not null,
  deadline_description text,
  sort_order smallint not null,
  url text
);

-- User's checklist progress
create table checklist_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  template_id uuid references checklist_templates(id),
  is_completed boolean default false,
  completed_at timestamptz,
  unique (profile_id, template_id)
);

-- Conversations (1:1 or group)
create table conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',
  name text,
  faculty_id uuid references faculties(id),
  created_at timestamptz default now()
);

create table conversation_members (
  conversation_id uuid references conversations(id) on delete cascade,
  profile_id uuid references profiles(id),
  joined_at timestamptz default now(),
  primary key (conversation_id, profile_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- Q&A
create table questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  faculty_id uuid references faculties(id),
  title text not null,
  body text,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  upvotes integer default 0,
  created_at timestamptz default now()
);

create table answer_votes (
  answer_id uuid references answers(id) on delete cascade,
  voter_id uuid references profiles(id),
  primary key (answer_id, voter_id)
);

-- Helper: find direct conversation between two users
create or replace function find_direct_conversation(user_a uuid, user_b uuid)
returns uuid as $$
  select c.id
  from conversations c
  join conversation_members m1 on m1.conversation_id = c.id and m1.profile_id = user_a
  join conversation_members m2 on m2.conversation_id = c.id and m2.profile_id = user_b
  where c.type = 'direct'
  limit 1;
$$ language sql stable;
```

---

## Chunk 1: Project Setup, Supabase & Auth

### Task 1: Initialize SvelteKit Project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`
- Create: `wrangler.toml`
- Create: `.env.local.example`
- Create: `.gitignore`

- [ ] **Step 1: Create SvelteKit project**

```bash
cd /Users/vladciobotarasu/projects/personal/reroute
npx sv create . --template minimal --types ts
```

Select: Tailwind CSS, Prettier, ESLint when prompted.

- [ ] **Step 2: Install Cloudflare adapter**

```bash
npm install -D @sveltejs/adapter-cloudflare
```

Update `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>']
      }
    })
  }
};
```

- [ ] **Step 3: Install Supabase + shadcn-svelte dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npx shadcn-svelte@latest init
```

- [ ] **Step 4: Create `.env.local.example`**

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 5: Create `wrangler.toml`**

```toml
name = "unistart"
compatibility_date = "2026-03-15"
pages_build_output_dir = ".svelte-kit/cloudflare"
```

- [ ] **Step 6: Init git repo, create GitHub repo, push**

```bash
git init
git add -A
git commit -m "chore: init sveltekit project with tailwind, cloudflare adapter"
gh repo create reroute --private --source=. --push
```

---

### Task 2: Supabase Setup & Database Schema

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `src/lib/types.ts`

- [ ] **Step 1: Initialize Supabase locally**

```bash
npx supabase init
```

- [ ] **Step 2: Create migration `supabase/migrations/001_initial_schema.sql`**

Copy the full schema from the Database Schema section above.

- [ ] **Step 3: Create seed data `supabase/seed.sql`**

```sql
-- Universities
INSERT INTO universities (id, name, short_name, email_domain) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Universitatea Națională de Știință și Tehnologie POLITEHNICA București', 'UPB', 'stud.upb.ro'),
  ('11111111-0000-0000-0000-000000000002', 'Academia de Studii Economice din București', 'ASE', 'stud.ase.ro'),
  ('11111111-0000-0000-0000-000000000003', 'Universitatea din București', 'UB', 'stud.unibuc.ro');

-- Faculties (UPB)
INSERT INTO faculties (university_id, name, short_name) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Automatică și Calculatoare', 'ACS'),
  ('11111111-0000-0000-0000-000000000001', 'Electronică, Telecomunicații și Tehnologia Informației', 'ETTI'),
  ('11111111-0000-0000-0000-000000000001', 'Inginerie Mecanică și Mecatronică', 'IMST'),
  ('11111111-0000-0000-0000-000000000001', 'Inginerie Electrică', 'IE');

-- Faculties (ASE)
INSERT INTO faculties (university_id, name, short_name) VALUES
  ('11111111-0000-0000-0000-000000000002', 'Cibernetică, Statistică și Informatică Economică', 'CSIE'),
  ('11111111-0000-0000-0000-000000000002', 'Management', 'MAN'),
  ('11111111-0000-0000-0000-000000000002', 'Finanțe, Asigurări, Bănci și Burse de Valori', 'FABBV');

-- Faculties (UB)
INSERT INTO faculties (university_id, name, short_name) VALUES
  ('11111111-0000-0000-0000-000000000003', 'Matematică și Informatică', 'FMI'),
  ('11111111-0000-0000-0000-000000000003', 'Drept', 'FD'),
  ('11111111-0000-0000-0000-000000000003', 'Litere', 'FL');

-- Checklist items (UPB)
INSERT INTO checklist_templates (university_id, title, description, category, deadline_description, sort_order, url) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Confirmă locul la facultate', 'Prezintă-te cu actele originale la secretariat pentru a confirma locul obținut. Ai nevoie de: diploma de bacalaureat (original), carte de identitate, certificat de naștere.', 'documents', 'De obicei până pe 25 iulie', 1, NULL),
  ('11111111-0000-0000-0000-000000000001', 'Depune cererea pentru cămin', 'Completează cererea de cazare pe platforma universității. Locurile sunt limitate — depune cât mai repede.', 'housing', 'De obicei până pe 5 august', 2, NULL),
  ('11111111-0000-0000-0000-000000000001', 'Plătește taxa de înmatriculare', 'Taxa se plătește la casieria universității sau prin transfer bancar. Păstrează chitanța.', 'documents', 'La confirmare', 3, NULL),
  ('11111111-0000-0000-0000-000000000001', 'Fă-ți adeverința medicală', 'Mergi la medicul de familie pentru adeverință medicală. Ai nevoie de analize de sânge recente.', 'documents', 'Înainte de înmatriculare', 4, NULL),
  ('11111111-0000-0000-0000-000000000001', 'Activează emailul universitar', 'Vei primi datele de acces pe emailul personal. Emailul universitar e necesar pentru acces la platforme.', 'registration', 'După înmatriculare', 5, 'https://upb.ro'),
  ('11111111-0000-0000-0000-000000000001', 'Înscrie-te la cursuri / vezi orarul', 'Verifică orarul pe site-ul facultății. La unele facultăți trebuie să te înscrii la opționale.', 'registration', 'Septembrie', 6, NULL),
  ('11111111-0000-0000-0000-000000000001', 'Fă-ți legitimația de student', 'Se face la secretariat cu o poză tip buletin. Cu ea ai reducere la STB și alte beneficii.', 'campus', 'Prima săptămână', 7, NULL),
  ('11111111-0000-0000-0000-000000000001', 'Fă-ți abonamentul STB redus', 'Cu legitimația de student ai dreptul la abonament STB redus. Se face online sau la ghișeu.', 'transport', 'După legitimație', 8, 'https://stbsa.ro'),
  ('11111111-0000-0000-0000-000000000001', 'Explorează campusul', 'Localizează: secretariatul, cantina, biblioteca, sălile de curs principale. Vino cu o zi înainte să nu te pierzi.', 'campus', 'Înainte de cursuri', 9, NULL),
  ('11111111-0000-0000-0000-000000000001', 'Descarcă aplicațiile necesare', 'Microsoft Teams (pentru cursuri online), My UPB, și orice app specifică facultății tale.', 'registration', 'Înainte de cursuri', 10, NULL);
```

- [ ] **Step 4: Create TypeScript types `src/lib/types.ts`**

```typescript
export interface University {
  id: string;
  name: string;
  short_name: string;
  email_domain: string | null;
}

export interface Faculty {
  id: string;
  university_id: string;
  name: string;
  short_name: string;
  university?: University;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  faculty_id: string | null;
  year: number;
  home_city: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  faculty?: Faculty;
}

export interface QuizAnswers {
  profile_id: string;
  sleep_schedule: number | null;
  cleanliness: number | null;
  noise_tolerance: number | null;
  guests_frequency: number | null;
  smoking: number | null;
  pets: number | null;
  study_vs_social: number | null;
}

export interface RoommatePreferences {
  profile_id: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_sectors: string[];
  move_in_month: string | null;
  gender_preference: string;
  has_apartment: boolean;
  apartment_link: string | null;
  looking_for_count: number;
}

export interface ChecklistTemplate {
  id: string;
  university_id: string;
  title: string;
  description: string | null;
  category: string;
  deadline_description: string | null;
  sort_order: number;
  url: string | null;
}

export interface ChecklistProgress {
  id: string;
  profile_id: string;
  template_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'faculty';
  name: string | null;
  faculty_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface Question {
  id: string;
  author_id: string;
  faculty_id: string | null;
  title: string;
  body: string | null;
  is_pinned: boolean;
  created_at: string;
  author?: Profile;
  answer_count?: number;
}

export interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  upvotes: number;
  created_at: string;
  author?: Profile;
  voted_by_me?: boolean;
}
```

- [ ] **Step 5: Apply migration locally and verify**

```bash
npx supabase start
npx supabase db reset
```

Expected: all tables created, seed data inserted.

- [ ] **Step 6: Commit**

```bash
git add supabase/ src/lib/types.ts
git commit -m "feat: add database schema, seed data, and typescript types"
```

---

### Task 3: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/supabase-server.ts`
- Create: `src/hooks.server.ts`
- Create: `src/routes/+layout.server.ts`
- Create: `src/routes/+layout.svelte`
- Create: `src/app.d.ts` (augment SvelteKit types)

- [ ] **Step 1: Create browser Supabase client `src/lib/supabase.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export function createClient() {
  return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}
```

- [ ] **Step 2: Create server Supabase client `src/lib/supabase-server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';

export function createServerSupabaseClient(cookies: Cookies) {
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...options, path: '/' });
        });
      },
    },
  });
}
```

- [ ] **Step 3: Create server hooks `src/hooks.server.ts`**

```typescript
import { createServerSupabaseClient } from '$lib/supabase-server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerSupabaseClient(event.cookies);

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };

    const { data: { user }, error } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };

    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};
```

- [ ] **Step 4: Augment SvelteKit types `src/app.d.ts`**

```typescript
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
    }
    interface PageData {
      session: Session | null;
      user: User | null;
    }
  }
}

export {};
```

- [ ] **Step 5: Create root server layout `src/routes/+layout.server.ts`**

```typescript
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();
  return { session, user };
};
```

- [ ] **Step 6: Create root layout `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createClient } from '$lib/supabase';
  import '../app.css';

  let { data, children } = $props();

  const supabase = createClient();

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth');
    });

    return () => subscription.unsubscribe();
  });
</script>

{@render children()}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase.ts src/lib/supabase-server.ts src/hooks.server.ts src/routes/+layout.server.ts src/routes/+layout.svelte src/app.d.ts
git commit -m "feat: add supabase client setup with SSR auth"
```

---

### Task 4: Auth Pages (Register, Login, Verify Email)

**Files:**
- Create: `src/routes/(auth)/+layout.svelte`
- Create: `src/routes/(auth)/register/+page.svelte`
- Create: `src/routes/(auth)/login/+page.svelte`
- Create: `src/routes/(auth)/verify-email/+page.svelte`

- [ ] **Step 1: Create auth layout `src/routes/(auth)/+layout.svelte`**

Centered card layout, no navigation bar. Just the content in the middle of the screen.

```svelte
<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
  <div class="w-full max-w-md">
    {@render children()}
  </div>
</div>
```

- [ ] **Step 2: Build register page `src/routes/(auth)/register/+page.svelte`**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase';

  const supabase = createClient();

  let fullName = $state('');
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleRegister(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    loading = true;

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });

      if (signUpError) throw signUpError;
      goto('/verify-email');
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-2xl shadow-sm border p-8">
  <h1 class="text-2xl font-bold text-center mb-2">Creează cont</h1>
  <p class="text-gray-500 text-center mb-6 text-sm">
    Folosește emailul tău universitar pentru verificare mai rapidă
  </p>

  <form onsubmit={handleRegister} class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium mb-1">Nume complet</label>
      <input
        id="name"
        type="text"
        bind:value={fullName}
        required
        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="email" class="block text-sm font-medium mb-1">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        required
        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium mb-1">Parolă</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        required
        minlength="6"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <button
      type="submit"
      disabled={loading || !fullName || !email || !password}
      class="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Se creează...' : 'Înregistrează-te'}
    </button>
  </form>

  <p class="text-center text-sm text-gray-500 mt-4">
    Ai deja cont? <a href="/login" class="text-blue-600 hover:underline">Conectează-te</a>
  </p>
</div>
```

- [ ] **Step 3: Build login page `src/routes/(auth)/login/+page.svelte`**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase';

  const supabase = createClient();

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    loading = true;

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      goto('/checklist');
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-2xl shadow-sm border p-8">
  <h1 class="text-2xl font-bold text-center mb-6">Bine ai revenit!</h1>

  <form onsubmit={handleLogin} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium mb-1">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        required
        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium mb-1">Parolă</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        required
        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {#if error}
      <p class="text-red-600 text-sm">{error}</p>
    {/if}

    <button
      type="submit"
      disabled={loading || !email || !password}
      class="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Se conectează...' : 'Conectează-te'}
    </button>
  </form>

  <p class="text-center text-sm text-gray-500 mt-4">
    Nu ai cont? <a href="/register" class="text-blue-600 hover:underline">Înregistrează-te</a>
  </p>
</div>
```

- [ ] **Step 4: Build verify email page `src/routes/(auth)/verify-email/+page.svelte`**

```svelte
<div class="bg-white rounded-2xl shadow-sm border p-8 text-center">
  <h1 class="text-2xl font-bold mb-4">Verifică-ți emailul</h1>
  <p class="text-gray-500 mb-6">
    Ți-am trimis un link de confirmare. Verifică inbox-ul (și spam-ul).
  </p>
  <a
    href="/login"
    class="inline-block bg-blue-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-blue-700 transition-colors"
  >
    Am confirmat, du-mă la login
  </a>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/routes/(auth)/
git commit -m "feat: add auth pages — register, login, email verification"
```

---

### Task 5: Profile Setup Flow

**Files:**
- Create: `src/routes/(auth)/setup-profile/+page.svelte`
- Create: `src/routes/(auth)/setup-profile/+page.server.ts`

- [ ] **Step 1: Create server load for setup page `src/routes/(auth)/setup-profile/+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: universities } = await locals.supabase
    .from('universities')
    .select('*, faculties(*)');

  return { universities: universities ?? [] };
};
```

- [ ] **Step 2: Build setup profile page `src/routes/(auth)/setup-profile/+page.svelte`**

Multi-step form:
1. Select university → shows faculties for that university
2. Enter home city
3. Submit → creates profile row → redirects to `/checklist`

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase';
  import type { University, Faculty } from '$lib/types';

  let { data } = $props();
  const supabase = createClient();

  let step = $state(1);
  let selectedUni = $state('');
  let selectedFaculty = $state('');
  let homeCity = $state('');
  let loading = $state(false);
  let error = $state('');

  let faculties = $derived(
    (data.universities as (University & { faculties: Faculty[] })[])
      .find(u => u.id === selectedUni)?.faculties ?? []
  );

  async function handleFinish() {
    loading = true;
    error = '';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata.full_name || user.email,
        faculty_id: selectedFaculty,
        home_city: homeCity || null,
      });

      if (insertError) throw insertError;
      goto('/checklist');
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-2xl shadow-sm border p-8">
  {#if step === 1}
    <h1 class="text-2xl font-bold text-center mb-6">La ce universitate ești?</h1>

    <div class="space-y-2 mb-6">
      {#each data.universities as uni}
        <button
          class="w-full text-left px-4 py-3 rounded-lg border transition-colors {selectedUni === uni.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}"
          onclick={() => { selectedUni = uni.id; selectedFaculty = ''; }}
        >
          <span class="font-medium">{uni.short_name}</span>
          <span class="text-gray-500 text-sm ml-2">{uni.name}</span>
        </button>
      {/each}
    </div>

    {#if faculties.length > 0}
      <h2 class="text-lg font-semibold mb-3">Facultatea:</h2>
      <div class="space-y-2 mb-6">
        {#each faculties as fac}
          <button
            class="w-full text-left px-4 py-3 rounded-lg border transition-colors {selectedFaculty === fac.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}"
            onclick={() => selectedFaculty = fac.id}
          >
            <span class="font-medium">{fac.short_name}</span>
            <span class="text-gray-500 text-sm ml-2">{fac.name}</span>
          </button>
        {/each}
      </div>
    {/if}

    <button
      onclick={() => step = 2}
      disabled={!selectedFaculty}
      class="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Continuă
    </button>

  {:else}
    <h1 class="text-2xl font-bold text-center mb-6">De unde ești?</h1>

    <input
      type="text"
      bind:value={homeCity}
      placeholder="ex: Cluj-Napoca"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    {#if error}
      <p class="text-red-600 text-sm mb-4">{error}</p>
    {/if}

    <button
      onclick={handleFinish}
      disabled={loading}
      class="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Se salvează...' : 'Gata, hai la treabă!'}
    </button>
  {/if}
</div>
```

- [ ] **Step 3: Add auth guard to root layout — redirect to login or setup-profile as needed**

Update `src/routes/+layout.server.ts`:

```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const publicRoutes = ['/login', '/register', '/verify-email'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session, user } = await locals.safeGetSession();

  const isPublicRoute = publicRoutes.some(r => url.pathname.startsWith(r));

  if (!session && !isPublicRoute) {
    redirect(303, '/login');
  }

  if (session && user) {
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile && !url.pathname.startsWith('/setup-profile')) {
      redirect(303, '/setup-profile');
    }

    return { session, user, profile };
  }

  return { session, user, profile: null };
};
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/(auth)/setup-profile/ src/routes/+layout.server.ts
git commit -m "feat: add profile setup flow with university/faculty selection"
```

---

## Chunk 2: Onboarding Checklist

### Task 6: Checklist Page

**Files:**
- Create: `src/routes/(app)/+layout.svelte`
- Create: `src/components/NavBar.svelte`
- Create: `src/components/ChecklistItem.svelte`
- Create: `src/routes/(app)/checklist/+page.server.ts`
- Create: `src/routes/(app)/checklist/+page.svelte`
- Test: `tests/unit/checklist-item.test.ts`

- [ ] **Step 1: Create NavBar component `src/components/NavBar.svelte`**

Bottom nav on mobile, side nav on desktop. 5 items: Checklist, Oameni, Mesaje, Întrebări, Profil.

```svelte
<script lang="ts">
  import { page } from '$app/state';

  const links = [
    { href: '/checklist', label: 'Checklist', icon: '📋' },
    { href: '/people', label: 'Oameni', icon: '👥' },
    { href: '/messages', label: 'Mesaje', icon: '💬' },
    { href: '/qa', label: 'Întrebări', icon: '❓' },
    { href: '/profile', label: 'Profil', icon: '👤' },
  ];
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-white border-t md:static md:border-t-0 md:border-r md:w-64 md:min-h-screen z-50">
  <div class="flex md:flex-col md:pt-6 md:gap-1">
    {#each links as link}
      <a
        href={link.href}
        class="flex-1 md:flex-none flex flex-col md:flex-row items-center md:gap-3 py-2 md:py-3 md:px-6 text-xs md:text-sm transition-colors
          {page.url.pathname.startsWith(link.href) ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'}"
      >
        <span class="text-lg md:text-base">{link.icon}</span>
        <span>{link.label}</span>
      </a>
    {/each}
  </div>
</nav>
```

- [ ] **Step 2: Create app layout `src/routes/(app)/+layout.svelte`**

```svelte
<script lang="ts">
  import NavBar from '../../components/NavBar.svelte';

  let { children } = $props();
</script>

<div class="md:flex min-h-screen bg-gray-50">
  <NavBar />
  <main class="flex-1 pb-20 md:pb-0">
    {@render children()}
  </main>
</div>
```

- [ ] **Step 3: Create checklist server load `src/routes/(app)/checklist/+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { user, profile } = await parent();
  if (!user || !profile?.faculty_id) return { items: [] };

  // Get university_id from faculty
  const { data: faculty } = await locals.supabase
    .from('faculties')
    .select('university_id')
    .eq('id', profile.faculty_id)
    .single();

  if (!faculty) return { items: [] };

  const [{ data: templates }, { data: progress }] = await Promise.all([
    locals.supabase
      .from('checklist_templates')
      .select('*')
      .eq('university_id', faculty.university_id)
      .order('sort_order'),
    locals.supabase
      .from('checklist_progress')
      .select('*')
      .eq('profile_id', user.id),
  ]);

  const progressMap = new Map(
    (progress ?? []).map((p: any) => [p.template_id, p])
  );

  const items = (templates ?? []).map((t: any) => ({
    ...t,
    is_completed: progressMap.get(t.id)?.is_completed ?? false,
  }));

  return { items };
};
```

- [ ] **Step 4: Build ChecklistItem component `src/components/ChecklistItem.svelte`**

```svelte
<script lang="ts">
  interface Props {
    id: string;
    title: string;
    description: string | null;
    category: string;
    deadline_description: string | null;
    url: string | null;
    is_completed: boolean;
    onToggle: (id: string) => void;
  }

  let { id, title, description, category, deadline_description, url, is_completed, onToggle }: Props = $props();

  let expanded = $state(false);

  const categoryColors: Record<string, string> = {
    documents: 'bg-blue-50 border-blue-200',
    registration: 'bg-purple-50 border-purple-200',
    housing: 'bg-green-50 border-green-200',
    campus: 'bg-orange-50 border-orange-200',
    transport: 'bg-cyan-50 border-cyan-200',
  };

  const categoryLabels: Record<string, string> = {
    documents: 'Acte',
    registration: 'Înregistrare',
    housing: 'Cazare',
    campus: 'Campus',
    transport: 'Transport',
  };
</script>

<div class="rounded-xl border transition-all {categoryColors[category] ?? 'bg-gray-50 border-gray-200'} {is_completed ? 'opacity-60' : ''}">
  <div class="flex items-start gap-3 p-4">
    <button
      onclick={() => onToggle(id)}
      class="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center
        {is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400 hover:border-green-500'}"
    >
      {#if is_completed}
        <span class="text-xs">✓</span>
      {/if}
    </button>

    <button
      class="flex-1 text-left"
      onclick={() => expanded = !expanded}
    >
      <div class="flex items-center gap-2">
        <span class="font-medium {is_completed ? 'line-through' : ''}">{title}</span>
        <span class="text-xs px-2 py-0.5 rounded-full bg-white/60">{categoryLabels[category] ?? category}</span>
      </div>
      {#if deadline_description}
        <p class="text-sm text-gray-500 mt-0.5">{deadline_description}</p>
      {/if}
    </button>
  </div>

  {#if expanded && description}
    <div class="px-4 pb-4 pl-12">
      <p class="text-sm text-gray-600">{description}</p>
      {#if url}
        <a href={url} target="_blank" rel="noopener" class="text-sm text-blue-600 hover:underline mt-2 inline-block">
          Link util →
        </a>
      {/if}
    </div>
  {/if}
</div>
```

- [ ] **Step 5: Build checklist page `src/routes/(app)/checklist/+page.svelte`**

```svelte
<script lang="ts">
  import { createClient } from '$lib/supabase';
  import ChecklistItem from '../../../components/ChecklistItem.svelte';

  let { data } = $props();
  const supabase = createClient();

  let items = $state(data.items);

  let completedCount = $derived(items.filter((i: any) => i.is_completed).length);
  let progress = $derived(items.length > 0 ? completedCount / items.length : 0);

  async function handleToggle(templateId: string) {
    const item = items.find((i: any) => i.id === templateId);
    if (!item) return;

    const newCompleted = !item.is_completed;

    // Optimistic update
    items = items.map((i: any) =>
      i.id === templateId ? { ...i, is_completed: newCompleted } : i
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('checklist_progress').upsert({
      profile_id: user.id,
      template_id: templateId,
      is_completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    });
  }
</script>

<div class="max-w-2xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-1">Checklist-ul tău</h1>
  <p class="text-gray-500 mb-4">{completedCount} din {items.length} completate</p>

  <!-- Progress bar -->
  <div class="w-full bg-gray-200 rounded-full h-2.5 mb-8">
    <div
      class="bg-green-500 h-2.5 rounded-full transition-all duration-300"
      style="width: {progress * 100}%"
    ></div>
  </div>

  <div class="space-y-3">
    {#each items as item (item.id)}
      <ChecklistItem {...item} onToggle={handleToggle} />
    {/each}
  </div>
</div>
```

- [ ] **Step 6: Commit**

```bash
git add src/routes/(app)/ src/components/NavBar.svelte src/components/ChecklistItem.svelte
git commit -m "feat: add onboarding checklist with progress tracking"
```

---

## Chunk 3: Compatibility Quiz & Matching

### Task 7: Matching Algorithm

**Files:**
- Create: `src/lib/matching.ts`
- Create: `src/lib/constants.ts`
- Test: `tests/unit/matching.test.ts`

- [ ] **Step 1: Write matching tests `tests/unit/matching.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateCompatibility } from '$lib/matching';
import type { QuizAnswers } from '$lib/types';

describe('calculateCompatibility', () => {
  const base: QuizAnswers = {
    profile_id: 'a',
    sleep_schedule: 3,
    cleanliness: 4,
    noise_tolerance: 2,
    guests_frequency: 2,
    smoking: 0,
    pets: 0,
    study_vs_social: 3,
  };

  it('returns 100 for identical profiles', () => {
    expect(calculateCompatibility(base, { ...base, profile_id: 'b' })).toBe(100);
  });

  it('returns null if either has no answers', () => {
    const empty: QuizAnswers = {
      profile_id: 'b',
      sleep_schedule: null, cleanliness: null, noise_tolerance: null,
      guests_frequency: null, smoking: null, pets: null, study_vs_social: null,
    };
    expect(calculateCompatibility(base, empty)).toBeNull();
  });

  it('penalizes smoking mismatch heavily', () => {
    const smoker = { ...base, profile_id: 'b', smoking: 2 };
    const nonSmoker = { ...base, profile_id: 'a', smoking: 0 };
    expect(calculateCompatibility(nonSmoker, smoker)).toBeLessThan(70);
  });

  it('scores higher for similar cleanliness', () => {
    const clean = { ...base, profile_id: 'b', cleanliness: 4 };
    const messy = { ...base, profile_id: 'c', cleanliness: 1 };
    const scoreClean = calculateCompatibility(base, clean)!;
    const scoreMessy = calculateCompatibility(base, messy)!;
    expect(scoreClean).toBeGreaterThan(scoreMessy);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/unit/matching.test.ts
```

- [ ] **Step 3: Implement `src/lib/matching.ts`**

```typescript
import type { QuizAnswers } from './types';

const WEIGHTS = {
  sleep_schedule: 3,
  cleanliness: 4,
  noise_tolerance: 3,
  guests_frequency: 2,
  smoking: 5,
  pets: 3,
  study_vs_social: 2,
};

const SCALE_FIELDS = [
  'sleep_schedule', 'cleanliness', 'noise_tolerance',
  'guests_frequency', 'study_vs_social',
] as const;

const MAX_SCALE = 5;

export function calculateCompatibility(a: QuizAnswers, b: QuizAnswers): number | null {
  const aHasAnswers = SCALE_FIELDS.some(f => a[f] !== null);
  const bHasAnswers = SCALE_FIELDS.some(f => b[f] !== null);
  if (!aHasAnswers || !bHasAnswers) return null;

  let totalWeight = 0;
  let weightedScore = 0;

  for (const field of SCALE_FIELDS) {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal === null || bVal === null) continue;

    const diff = Math.abs(aVal - bVal);
    const similarity = 1 - diff / (MAX_SCALE - 1);
    weightedScore += similarity * WEIGHTS[field];
    totalWeight += WEIGHTS[field];
  }

  if (a.smoking !== null && b.smoking !== null) {
    let similarity: number;
    if (a.smoking === b.smoking) similarity = 1;
    else if ((a.smoking === 0 && b.smoking === 2) || (a.smoking === 2 && b.smoking === 0)) similarity = 0;
    else similarity = 0.3;
    weightedScore += similarity * WEIGHTS.smoking;
    totalWeight += WEIGHTS.smoking;
  }

  if (a.pets !== null && b.pets !== null) {
    const similarity = a.pets === b.pets ? 1 : 0.2;
    weightedScore += similarity * WEIGHTS.pets;
    totalWeight += WEIGHTS.pets;
  }

  if (totalWeight === 0) return null;
  return Math.round((weightedScore / totalWeight) * 100);
}
```

- [ ] **Step 4: Create constants `src/lib/constants.ts`**

```typescript
export const QUIZ_QUESTIONS = [
  {
    key: 'sleep_schedule' as const,
    question: 'Când te culci de obicei?',
    min: 1, max: 5,
    labels: ['22:00', '23:00', '00:00', '01:00', '02:00+'],
    type: 'slider' as const,
  },
  {
    key: 'cleanliness' as const,
    question: 'Cât de ordonat/ă ești?',
    min: 1, max: 5,
    labels: ['Relaxat', '', 'Moderat', '', 'Impecabil'],
    type: 'slider' as const,
  },
  {
    key: 'noise_tolerance' as const,
    question: 'Cum ești cu zgomotul?',
    min: 1, max: 5,
    labels: ['Liniște totală', '', 'Moderat', '', 'Nu mă deranjează'],
    type: 'slider' as const,
  },
  {
    key: 'guests_frequency' as const,
    question: 'Cât de des ai musafiri?',
    min: 1, max: 5,
    labels: ['Rar', '', 'Ocazional', '', 'Des'],
    type: 'slider' as const,
  },
  {
    key: 'smoking' as const,
    question: 'Fumezi?',
    options: [
      { value: 0, label: 'Nu' },
      { value: 1, label: 'Doar afară' },
      { value: 2, label: 'Da' },
    ],
    type: 'choice' as const,
  },
  {
    key: 'pets' as const,
    question: 'Ai sau vrei animale de companie?',
    options: [
      { value: 0, label: 'Nu' },
      { value: 1, label: 'Da' },
    ],
    type: 'choice' as const,
  },
  {
    key: 'study_vs_social' as const,
    question: 'Cum îți petreci timpul liber acasă?',
    min: 1, max: 5,
    labels: ['Învăț/lucrez', '', '50/50', '', 'Socializez'],
    type: 'slider' as const,
  },
];

export const BUCHAREST_SECTORS = [
  'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6',
  'Militari', 'Drumul Taberei', 'Titan', 'Colentina', 'Rahova', 'Cotroceni', 'Regie',
];
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/unit/matching.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/matching.ts src/lib/constants.ts tests/unit/matching.test.ts
git commit -m "feat: add compatibility scoring algorithm and quiz constants"
```

---

### Task 8: Lifestyle Quiz Page

**Files:**
- Create: `src/routes/(app)/quiz/+page.svelte`

- [ ] **Step 1: Build quiz page**

One question at a time. Progress bar at top. Slider for scale questions, buttons for choice questions. Navigation: back/next. On final submit, upsert to `quiz_answers` table.

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase';
  import { QUIZ_QUESTIONS } from '$lib/constants';

  const supabase = createClient();

  let currentIndex = $state(0);
  let answers = $state<Record<string, number>>({});
  let loading = $state(false);

  let question = $derived(QUIZ_QUESTIONS[currentIndex]);
  let progress = $derived((currentIndex + 1) / QUIZ_QUESTIONS.length);
  let isLast = $derived(currentIndex === QUIZ_QUESTIONS.length - 1);
  let canProceed = $derived(answers[question.key] !== undefined);

  function selectValue(value: number) {
    answers[question.key] = value;
  }

  async function handleNext() {
    if (!isLast) {
      currentIndex++;
      return;
    }

    loading = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('quiz_answers').upsert({
      profile_id: user.id,
      ...answers,
    });

    goto('/people');
  }
</script>

<div class="max-w-lg mx-auto p-6">
  <!-- Progress -->
  <div class="w-full bg-gray-200 rounded-full h-1.5 mb-8">
    <div class="bg-blue-500 h-1.5 rounded-full transition-all" style="width: {progress * 100}%"></div>
  </div>

  <p class="text-sm text-gray-400 mb-2">{currentIndex + 1} / {QUIZ_QUESTIONS.length}</p>
  <h2 class="text-xl font-bold mb-8">{question.question}</h2>

  {#if question.type === 'slider'}
    <div class="space-y-4">
      <input
        type="range"
        min={question.min}
        max={question.max}
        value={answers[question.key] ?? question.min}
        oninput={(e) => selectValue(Number(e.currentTarget.value))}
        class="w-full accent-blue-600"
      />
      <div class="flex justify-between text-sm text-gray-500">
        {#each question.labels as label}
          <span class="w-12 text-center">{label}</span>
        {/each}
      </div>
    </div>
  {:else if question.type === 'choice'}
    <div class="space-y-3">
      {#each question.options as option}
        <button
          onclick={() => selectValue(option.value)}
          class="w-full text-left px-4 py-3 rounded-xl border transition-colors
            {answers[question.key] === option.value ? 'border-blue-500 bg-blue-50 font-medium' : 'border-gray-200 hover:bg-gray-50'}"
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}

  <div class="flex gap-3 mt-10">
    {#if currentIndex > 0}
      <button
        onclick={() => currentIndex--}
        class="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Înapoi
      </button>
    {/if}
    <button
      onclick={handleNext}
      disabled={!canProceed || loading}
      class="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {#if loading}
        Se salvează...
      {:else if isLast}
        Gata!
      {:else}
        Continuă
      {/if}
    </button>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/(app)/quiz/
git commit -m "feat: add lifestyle quiz with step-by-step flow"
```

---

### Task 9: Browse People & Roommate Search

**Files:**
- Create: `src/components/ProfileCard.svelte`
- Create: `src/components/CompatibilityBadge.svelte`
- Create: `src/components/FilterDrawer.svelte`
- Create: `src/routes/(app)/people/+page.server.ts`
- Create: `src/routes/(app)/people/+page.svelte`
- Create: `src/routes/(app)/people/[id]/+page.server.ts`
- Create: `src/routes/(app)/people/[id]/+page.svelte`

- [ ] **Step 1: Build CompatibilityBadge `src/components/CompatibilityBadge.svelte`**

```svelte
<script lang="ts">
  let { score }: { score: number | null } = $props();

  let color = $derived(
    score === null ? 'bg-gray-100 text-gray-500' :
    score >= 75 ? 'bg-green-100 text-green-700' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700'
  );
</script>

{#if score !== null}
  <span class="text-xs font-medium px-2 py-1 rounded-full {color}">
    {score}% compatibil
  </span>
{/if}
```

- [ ] **Step 2: Build ProfileCard `src/components/ProfileCard.svelte`**

Shows avatar (or initials), name, faculty short name, home city, compatibility badge, "caută coleg" tag if has roommate prefs. Links to `/people/{id}`.

- [ ] **Step 3: Build FilterDrawer `src/components/FilterDrawer.svelte`**

Slide-in drawer with: budget range, sector multi-select (chips from BUCHAREST_SECTORS), move-in month, gender preference, "has apartment" toggle, "only with quiz" toggle. Applies filters as URL search params.

- [ ] **Step 4: Create people server load `src/routes/(app)/people/+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
  const { user } = await parent();
  if (!user) return { people: [], myQuiz: null };

  // Load current user's quiz answers for compatibility calc
  const { data: myQuiz } = await locals.supabase
    .from('quiz_answers')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  // Load all active profiles with their quiz answers and roommate prefs
  const { data: people } = await locals.supabase
    .from('profiles')
    .select('*, faculty:faculties(short_name, university_id), quiz_answers(*), roommate_preferences(*)')
    .eq('is_active', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false });

  return { people: people ?? [], myQuiz };
};
```

- [ ] **Step 5: Build people page `src/routes/(app)/people/+page.svelte`**

Two tabs: "Toți" (all people) and "Caută coleg" (only those with roommate prefs). Grid of ProfileCards. Filter button opens FilterDrawer. Compatibility scores calculated client-side using `calculateCompatibility()`. Sort by compatibility when in roommate tab.

- [ ] **Step 6: Build person detail page `src/routes/(app)/people/[id]/+page.svelte`**

Full profile: avatar, name, bio, faculty, year, home city. If both took quiz: compatibility breakdown per dimension. Roommate preferences section (budget, area, timing). "Trimite mesaj" button.

- [ ] **Step 7: Commit**

```bash
git add src/components/ProfileCard.svelte src/components/CompatibilityBadge.svelte src/components/FilterDrawer.svelte src/routes/(app)/people/
git commit -m "feat: add people browsing with compatibility scores and filters"
```

---

## Chunk 4: Messaging

### Task 10: Conversations & Chat

**Files:**
- Create: `src/routes/(app)/messages/+page.server.ts`
- Create: `src/routes/(app)/messages/+page.svelte`
- Create: `src/routes/(app)/messages/[id]/+page.server.ts`
- Create: `src/routes/(app)/messages/[id]/+page.svelte`
- Create: `src/components/MessageBubble.svelte`
- Create: `src/routes/api/conversations/+server.ts`

- [ ] **Step 1: Create API route to get or create a direct conversation**

`src/routes/api/conversations/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { other_user_id } = await request.json();
  const { session } = await locals.safeGetSession();
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  // Check for existing direct conversation
  const { data: existing } = await locals.supabase
    .rpc('find_direct_conversation', { user_a: userId, user_b: other_user_id });

  if (existing) return json({ conversation_id: existing });

  // Create new conversation
  const { data: conv } = await locals.supabase
    .from('conversations')
    .insert({ type: 'direct' })
    .select('id')
    .single();

  await locals.supabase.from('conversation_members').insert([
    { conversation_id: conv!.id, profile_id: userId },
    { conversation_id: conv!.id, profile_id: other_user_id },
  ]);

  return json({ conversation_id: conv!.id });
};
```

- [ ] **Step 2: Build conversations list `src/routes/(app)/messages/+page.svelte`**

Load all conversations the user is a member of, with the latest message and other participant's name/avatar. Show faculty group chats in a separate "Grupuri" section at top.

- [ ] **Step 3: Build MessageBubble `src/components/MessageBubble.svelte`**

```svelte
<script lang="ts">
  interface Props {
    content: string;
    sender_name: string;
    is_mine: boolean;
    timestamp: string;
    show_sender: boolean;
  }

  let { content, sender_name, is_mine, timestamp, show_sender }: Props = $props();

  let timeStr = $derived(
    new Date(timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  );
</script>

<div class="flex {is_mine ? 'justify-end' : 'justify-start'} mb-2">
  <div class="max-w-xs md:max-w-md">
    {#if show_sender && !is_mine}
      <p class="text-xs text-gray-500 mb-0.5 ml-3">{sender_name}</p>
    {/if}
    <div class="px-4 py-2 rounded-2xl {is_mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}">
      <p class="text-sm">{content}</p>
    </div>
    <p class="text-xs text-gray-400 mt-0.5 {is_mine ? 'text-right mr-1' : 'ml-3'}">{timeStr}</p>
  </div>
</div>
```

- [ ] **Step 4: Build chat screen `src/routes/(app)/messages/[id]/+page.svelte`**

- Load messages on mount
- Subscribe to Supabase Realtime for new messages:
  ```typescript
  const channel = supabase
    .channel(`chat-${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => {
      messages = [...messages, payload.new];
    })
    .subscribe();
  ```
- Text input + send at bottom
- Auto-scroll to newest message
- Show sender name in group chats, hide in direct

- [ ] **Step 5: Commit**

```bash
git add src/routes/(app)/messages/ src/routes/api/ src/components/MessageBubble.svelte
git commit -m "feat: add real-time messaging with direct and group conversations"
```

---

### Task 11: Faculty Group Chat Auto-Creation

**Files:**
- Modify: `src/routes/(auth)/setup-profile/+page.svelte`

- [ ] **Step 1: After profile creation, find or create faculty group chat and join user**

In the `handleFinish` function, after creating the profile:

```typescript
// Find or create faculty group chat
const { data: existingChat } = await supabase
  .from('conversations')
  .select('id')
  .eq('type', 'faculty')
  .eq('faculty_id', selectedFaculty)
  .single();

let chatId: string;
if (existingChat) {
  chatId = existingChat.id;
} else {
  const facultyName = faculties.find(f => f.id === selectedFaculty)?.short_name;
  const { data: newChat } = await supabase
    .from('conversations')
    .insert({ type: 'faculty', faculty_id: selectedFaculty, name: `${facultyName} — Anul 1` })
    .select('id')
    .single();
  chatId = newChat!.id;
}

await supabase.from('conversation_members').insert({
  conversation_id: chatId,
  profile_id: user.id,
});
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/(auth)/setup-profile/
git commit -m "feat: auto-join faculty group chat on profile creation"
```

---

## Chunk 5: Q&A Board

### Task 12: Questions & Answers

**Files:**
- Create: `src/components/QuestionCard.svelte`
- Create: `src/routes/(app)/qa/+page.server.ts`
- Create: `src/routes/(app)/qa/+page.svelte`
- Create: `src/routes/(app)/qa/ask/+page.svelte`
- Create: `src/routes/(app)/qa/[id]/+page.server.ts`
- Create: `src/routes/(app)/qa/[id]/+page.svelte`

- [ ] **Step 1: Build QuestionCard `src/components/QuestionCard.svelte`**

Shows: title, author name + year badge (e.g., "Anul 3" = experienced), faculty tag if faculty-specific, answer count, relative time. Links to `/qa/{id}`.

- [ ] **Step 2: Build Q&A list page `src/routes/(app)/qa/+page.svelte`**

FlatList of questions. Pinned at top. Filter tabs: "Toate" / "Facultatea mea" / "Generale". Floating "Întreabă" button links to `/qa/ask`.

- [ ] **Step 3: Build ask question page `src/routes/(app)/qa/ask/+page.svelte`**

Form: title (required), body (optional textarea), faculty select (optional, defaults to general). Submit inserts into `questions` table, redirects to the new question page.

- [ ] **Step 4: Build question detail page `src/routes/(app)/qa/[id]/+page.svelte`**

- Question title + body at top
- List of answers sorted by upvotes (desc)
- Each answer: author with year badge, body text, upvote button with count
- Answer input at bottom
- Upvote toggle: insert/delete from `answer_votes`, update `answers.upvotes` count

- [ ] **Step 5: Commit**

```bash
git add src/components/QuestionCard.svelte src/routes/(app)/qa/
git commit -m "feat: add Q&A board with answers and upvoting"
```

---

## Chunk 6: Profile Page & Polish

### Task 13: Profile Screen

**Files:**
- Create: `src/routes/(app)/profile/+page.server.ts`
- Create: `src/routes/(app)/profile/+page.svelte`

- [ ] **Step 1: Build profile page**

Displays current user's profile with edit-in-place:
- Avatar (placeholder for now, upload in v1.5)
- Full name (editable)
- Bio (editable textarea)
- Faculty + university (read-only)
- Home city (editable)
- "Completează quiz-ul" link if quiz not taken, "Refă quiz-ul" if taken
- Roommate preferences section (edit inline): budget, sectors, move-in month, gender pref, has apartment toggle, apartment link
- "Am găsit coleg de cameră!" button → sets `is_active = false`, confirms with dialog
- Sign out button

- [ ] **Step 2: Commit**

```bash
git add src/routes/(app)/profile/
git commit -m "feat: add profile page with edit and roommate preferences"
```

---

### Task 14: Landing Page & Root Redirect

**Files:**
- Create: `src/routes/+page.svelte`
- Create: `src/routes/+page.server.ts`

- [ ] **Step 1: Create root page**

If logged in with profile → redirect to `/checklist`.
If logged in without profile → redirect to `/setup-profile`.
If not logged in → show a simple landing page with app description and "Înregistrează-te" / "Conectează-te" buttons.

- [ ] **Step 2: Commit**

```bash
git add src/routes/+page.svelte src/routes/+page.server.ts
git commit -m "feat: add landing page with auth redirect logic"
```

---

## Chunk 7: RLS, Deployment & CI

### Task 15: Row Level Security

**Files:**
- Create: `supabase/migrations/002_rls_policies.sql`

- [ ] **Step 1: Write RLS policies**

```sql
-- Enable RLS
alter table profiles enable row level security;
alter table quiz_answers enable row level security;
alter table roommate_preferences enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_progress enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table answer_votes enable row level security;

-- Profiles
create policy "Profiles viewable by authenticated" on profiles
  for select to authenticated using (is_active = true);
create policy "Users can insert own profile" on profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update to authenticated using (auth.uid() = id);

-- Quiz answers
create policy "Quiz answers viewable by authenticated" on quiz_answers
  for select to authenticated using (true);
create policy "Users can manage own quiz" on quiz_answers
  for all to authenticated using (auth.uid() = profile_id);

-- Roommate preferences
create policy "Roommate prefs viewable by authenticated" on roommate_preferences
  for select to authenticated using (true);
create policy "Users can manage own prefs" on roommate_preferences
  for all to authenticated using (auth.uid() = profile_id);

-- Checklist
create policy "Templates viewable by authenticated" on checklist_templates
  for select to authenticated using (true);
create policy "Users can manage own progress" on checklist_progress
  for all to authenticated using (auth.uid() = profile_id);

-- Conversations
create policy "Members can view conversations" on conversations
  for select to authenticated using (
    id in (select conversation_id from conversation_members where profile_id = auth.uid())
  );
create policy "Authenticated can create conversations" on conversations
  for insert to authenticated with check (true);

-- Conversation members
create policy "Members can view members" on conversation_members
  for select to authenticated using (
    conversation_id in (select conversation_id from conversation_members where profile_id = auth.uid())
  );
create policy "Authenticated can join conversations" on conversation_members
  for insert to authenticated with check (auth.uid() = profile_id);

-- Messages
create policy "Members can read messages" on messages
  for select to authenticated using (
    conversation_id in (select conversation_id from conversation_members where profile_id = auth.uid())
  );
create policy "Members can send messages" on messages
  for insert to authenticated with check (
    auth.uid() = sender_id and
    conversation_id in (select conversation_id from conversation_members where profile_id = auth.uid())
  );

-- Q&A
create policy "Questions viewable by authenticated" on questions
  for select to authenticated using (true);
create policy "Authenticated can ask" on questions
  for insert to authenticated with check (auth.uid() = author_id);

create policy "Answers viewable by authenticated" on answers
  for select to authenticated using (true);
create policy "Authenticated can answer" on answers
  for insert to authenticated with check (auth.uid() = author_id);

create policy "Users can manage own votes" on answer_votes
  for all to authenticated using (auth.uid() = voter_id);

-- Universities and faculties are public read
alter table universities enable row level security;
alter table faculties enable row level security;
create policy "Universities are public" on universities for select using (true);
create policy "Faculties are public" on faculties for select using (true);
```

- [ ] **Step 2: Apply and test**

```bash
npx supabase db reset
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_rls_policies.sql
git commit -m "feat: add row level security policies"
```

---

### Task 16: Deploy to Cloudflare Pages

**Files:**
- Modify: `wrangler.toml` (if needed)

- [ ] **Step 1: Create Supabase cloud project**

Go to supabase.com, create a new project. Note the URL and anon key.

- [ ] **Step 2: Push migrations to Supabase cloud**

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

- [ ] **Step 3: Deploy to Cloudflare Pages**

```bash
npm run build
npx wrangler pages project create unistart
npx wrangler pages deploy .svelte-kit/cloudflare
```

- [ ] **Step 4: Set environment variables in Cloudflare dashboard**

In Cloudflare Pages > Settings > Environment variables:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 5: Connect GitHub repo for auto-deploy**

In Cloudflare Pages dashboard, connect the GitHub repo. Set build command: `npm run build`, output directory: `.svelte-kit/cloudflare`.

- [ ] **Step 6: Commit any config changes**

```bash
git add wrangler.toml
git commit -m "chore: configure cloudflare pages deployment"
```

---

### Task 17: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm run lint
      - run: npx vitest run
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "chore: add github actions CI pipeline"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 — Setup & Auth | Tasks 1-5 | SvelteKit project, Supabase, auth flow, profile setup |
| 2 — Checklist | Task 6 | Onboarding checklist with progress tracking |
| 3 — Quiz & Matching | Tasks 7-9 | Lifestyle quiz, compatibility algorithm, people browsing |
| 4 — Messaging | Tasks 10-11 | Real-time DMs + auto-created faculty group chats |
| 5 — Q&A | Task 12 | Question board with answers and upvoting |
| 6 — Profile & Polish | Tasks 13-14 | Profile editing, landing page, routing |
| 7 — Security & Deploy | Tasks 15-17 | RLS policies, Cloudflare Pages, GitHub Actions CI |

**Total: 17 tasks across 7 chunks.**

**After MVP, consider:**
- Avatar upload (Supabase Storage)
- Push notifications (web push via service worker)
- PWA manifest (installable from browser)
- Expand checklist seed data to ASE and UB
- Admin panel for managing checklist content
- Email notifications for new messages
- "I have an apartment" flow with OLX link embedding
