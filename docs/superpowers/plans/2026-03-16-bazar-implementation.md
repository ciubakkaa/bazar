# Bazar Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a SvelteKit web app that helps Romanian university students with onboarding checklists, roommate matching, messaging, and Q&A — deployed to Cloudflare Pages with Supabase backend.

**Architecture:** SvelteKit frontend with server-side rendering, Supabase for auth (email/Google/Apple + OTP), PostgreSQL database with RLS, Realtime subscriptions for chat, Edge Functions for university email verification. Styled with Tailwind CSS v4 + shadcn-svelte, heavily customized to a warm/playful design system.

**Tech Stack:** SvelteKit, TypeScript, Tailwind CSS v4, shadcn-svelte, Supabase (Auth, PostgreSQL, Realtime, Storage, Edge Functions), Cloudflare Pages, Vitest, Playwright, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-03-16-bazar-design.md`

---

## Chunk 1: Project Scaffolding & Supabase Schema

### Task 1: Initialize SvelteKit Project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json` (via scaffolding)
- Create: `wrangler.toml`
- Create: `.env.local.example`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold SvelteKit project**

```bash
cd /Users/vladciobotarasu/projects/personal/bazar
npx sv create . --template minimal --types ts
```

Select when prompted: Tailwind CSS, Prettier, ESLint.

- [ ] **Step 2: Install Cloudflare adapter**

```bash
npm install -D @sveltejs/adapter-cloudflare
```

- [ ] **Step 3: Configure Cloudflare adapter**

Replace contents of `svelte.config.js`:

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

- [ ] **Step 4: Install Supabase dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 5: Install shadcn-svelte**

```bash
npx shadcn-svelte@latest init
```

Accept defaults. This sets up the `$lib/components/ui` directory and configures Tailwind.

- [ ] **Step 6: Create `.env.local.example`**

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 7: Create `wrangler.toml`**

```toml
name = "bazar"
compatibility_date = "2026-03-16"
pages_build_output_dir = ".svelte-kit/cloudflare"
```

- [ ] **Step 8: Verify the project builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 9: Init git repo and push**

```bash
git init
git add -A
git commit -m "chore: scaffold sveltekit project with tailwind, cloudflare adapter, supabase"
gh repo create bazar --private --source=. --push
```

---

### Task 2: Supabase Project & Database Schema

**Files:**
- Create: `supabase/config.toml` (via `supabase init`)
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create Supabase cloud project**

Use the Supabase MCP tool to create a project named "bazar" in the user's organization. Note the project URL and anon key.

- [ ] **Step 2: Create `.env.local` with real Supabase credentials**

After creating the Supabase project, get the URL and anon key from the project settings and create `.env.local`:

```env
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

This is required before any build step — SvelteKit's `$env/static/public` resolves at build time.

- [ ] **Step 3: Initialize Supabase locally**

```bash
npx supabase init
```

- [ ] **Step 4: Create migration `supabase/migrations/001_initial_schema.sql`**

Copy the full schema from the spec's "Database Schema" section. This includes all 14 tables, triggers (`update_conversation_last_message`, `update_answer_upvotes`), functions (`find_direct_conversation`, `redeem_invite_code`, `get_or_create_dm`, `join_faculty_group_chat`), and the partial unique index on `conversations`.

Full SQL from spec — write this verbatim:

```sql
-- Universities (seeded, ~15 major Romanian universities)
create table universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  email_domain text,
  city text
);

create table faculties (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id),
  name text not null,
  short_name text not null
);

create table invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  university_id uuid references universities(id),
  source text not null,
  max_uses integer,
  used_count integer default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id),
  full_name text not null,
  avatar_url text,
  bio text,
  faculty_id uuid references faculties(id),
  year smallint default 1,
  home_city text,
  university_email text,
  is_verified boolean default false,
  is_active boolean default true,
  invite_code_id uuid references invite_codes(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table university_email_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  email text not null,
  code text not null,
  attempts smallint default 0,
  expires_at timestamptz not null,
  verified boolean default false,
  created_at timestamptz default now()
);

create table quiz_answers (
  profile_id uuid primary key references profiles(id),
  sleep_schedule smallint,
  cleanliness smallint,
  noise_tolerance smallint,
  guests_frequency smallint,
  smoking smallint,
  pets smallint,
  study_vs_social smallint,
  updated_at timestamptz default now()
);

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

create table checklist_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  template_id uuid references checklist_templates(id),
  is_completed boolean default false,
  completed_at timestamptz,
  unique (profile_id, template_id)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',
  name text,
  faculty_id uuid references faculties(id),
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create unique index conversations_faculty_unique
  on conversations (faculty_id) where type = 'faculty';

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

create or replace function update_conversation_last_message()
returns trigger as $$
begin
  update conversations set last_message_at = now()
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_new_message
  after insert on messages
  for each row execute function update_conversation_last_message();

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

create or replace function update_answer_upvotes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update answers set upvotes = upvotes + 1 where id = NEW.answer_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update answers set upvotes = upvotes - 1 where id = OLD.answer_id;
    return OLD;
  end if;
end;
$$ language plpgsql;

create trigger on_vote_change
  after insert or delete on answer_votes
  for each row execute function update_answer_upvotes();

create or replace function find_direct_conversation(user_a uuid, user_b uuid)
returns uuid as $$
  select c.id
  from conversations c
  join conversation_members m1 on m1.conversation_id = c.id and m1.profile_id = user_a
  join conversation_members m2 on m2.conversation_id = c.id and m2.profile_id = user_b
  where c.type = 'direct'
    and (select count(*) from conversation_members where conversation_id = c.id) = 2
  limit 1;
$$ language sql stable;

create or replace function redeem_invite_code(code_text text)
returns uuid as $$
declare
  code_row invite_codes%rowtype;
begin
  select * into code_row from invite_codes
  where code = code_text
    and (max_uses is null or used_count < max_uses)
    and (expires_at is null or expires_at > now());
  if not found then return null; end if;
  update invite_codes set used_count = used_count + 1 where id = code_row.id;
  return code_row.id;
end;
$$ language plpgsql security definer;

create or replace function get_or_create_dm(user_a uuid, user_b uuid)
returns uuid as $$
declare
  conv_id uuid;
begin
  select find_direct_conversation(user_a, user_b) into conv_id;
  if conv_id is not null then return conv_id; end if;
  insert into conversations (type) values ('direct') returning id into conv_id;
  insert into conversation_members (conversation_id, profile_id) values
    (conv_id, user_a),
    (conv_id, user_b);
  return conv_id;
end;
$$ language plpgsql security definer;

create or replace function join_faculty_group_chat(p_profile_id uuid, p_faculty_id uuid, p_faculty_short_name text)
returns uuid as $$
declare
  chat_id uuid;
begin
  select id into chat_id from conversations
  where type = 'faculty' and faculty_id = p_faculty_id;
  if chat_id is null then
    insert into conversations (type, faculty_id, name)
    values ('faculty', p_faculty_id, p_faculty_short_name || ' — Anul 1')
    on conflict (faculty_id) where type = 'faculty'
    do update set faculty_id = excluded.faculty_id
    returning id into chat_id;
  end if;
  insert into conversation_members (conversation_id, profile_id)
  values (chat_id, p_profile_id)
  on conflict do nothing;
  return chat_id;
end;
$$ language plpgsql security definer;
```

- [ ] **Step 5: Create RLS policies `supabase/migrations/002_rls_policies.sql`**

```sql
-- Enable RLS on all tables
alter table universities enable row level security;
alter table faculties enable row level security;
alter table invite_codes enable row level security;
alter table profiles enable row level security;
alter table university_email_verifications enable row level security;
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

-- Public read tables (needed for signup flow)
create policy "Universities are public" on universities for select using (true);
create policy "Faculties are public" on faculties for select using (true);
create policy "Checklist templates are public" on checklist_templates for select using (true);
create policy "Invite codes readable by all" on invite_codes for select using (true);

-- Profiles
create policy "Profiles viewable by authenticated" on profiles
  for select to authenticated using (is_active = true or auth.uid() = id);
create policy "Users can insert own profile" on profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update to authenticated using (auth.uid() = id);

-- University email verifications
create policy "Users can view own verifications" on university_email_verifications
  for select to authenticated using (auth.uid() = profile_id);
create policy "Users can insert own verifications" on university_email_verifications
  for insert to authenticated with check (auth.uid() = profile_id);
create policy "Users can update own verifications" on university_email_verifications
  for update to authenticated using (auth.uid() = profile_id);

-- Quiz answers
create policy "Quiz answers viewable by authenticated" on quiz_answers
  for select to authenticated using (true);
create policy "Users can insert own quiz" on quiz_answers
  for insert to authenticated with check (auth.uid() = profile_id);
create policy "Users can update own quiz" on quiz_answers
  for update to authenticated using (auth.uid() = profile_id);

-- Roommate preferences
create policy "Roommate prefs viewable by authenticated" on roommate_preferences
  for select to authenticated using (true);
create policy "Users can insert own prefs" on roommate_preferences
  for insert to authenticated with check (auth.uid() = profile_id);
create policy "Users can update own prefs" on roommate_preferences
  for update to authenticated using (auth.uid() = profile_id);

-- Checklist progress
create policy "Users can view own progress" on checklist_progress
  for select to authenticated using (auth.uid() = profile_id);
create policy "Users can insert own progress" on checklist_progress
  for insert to authenticated with check (auth.uid() = profile_id);
create policy "Users can update own progress" on checklist_progress
  for update to authenticated using (auth.uid() = profile_id);

-- Conversations (read only — creation via SECURITY DEFINER functions)
create policy "Members can view conversations" on conversations
  for select to authenticated using (
    id in (select conversation_id from conversation_members where profile_id = auth.uid())
  );

-- Conversation members (read only — managed by SECURITY DEFINER functions)
create policy "Members can view members" on conversation_members
  for select to authenticated using (
    conversation_id in (select conversation_id from conversation_members where profile_id = auth.uid())
  );

-- Messages
create policy "Members can read messages" on messages
  for select to authenticated using (
    conversation_id in (select conversation_id from conversation_members where profile_id = auth.uid())
  );
create policy "Verified members can send messages" on messages
  for insert to authenticated with check (
    auth.uid() = sender_id and
    conversation_id in (select conversation_id from conversation_members where profile_id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and is_verified = true)
  );

-- Questions
create policy "Questions viewable by authenticated" on questions
  for select to authenticated using (true);
create policy "Verified users can ask" on questions
  for insert to authenticated with check (
    auth.uid() = author_id and
    exists (select 1 from profiles where id = auth.uid() and is_verified = true)
  );

-- Answers
create policy "Answers viewable by authenticated" on answers
  for select to authenticated using (true);
create policy "Verified users can answer" on answers
  for insert to authenticated with check (
    auth.uid() = author_id and
    exists (select 1 from profiles where id = auth.uid() and is_verified = true)
  );

-- Answer votes
create policy "Votes viewable by authenticated" on answer_votes
  for select to authenticated using (true);
create policy "Verified users can vote" on answer_votes
  for insert to authenticated with check (
    auth.uid() = voter_id and
    exists (select 1 from profiles where id = auth.uid() and is_verified = true)
  );
create policy "Users can remove own votes" on answer_votes
  for delete to authenticated using (auth.uid() = voter_id);
```

- [ ] **Step 6: Create seed data `supabase/seed.sql`**

Seed ~15 universities with faculties and ~10 generic checklist items + UPB-specific items. Research accurate faculty names, short names, and email domains.

Universities to seed: UPB (Bucharest), ASE (Bucharest), UB (Bucharest), UBB (Cluj-Napoca), UAIC (Iași), UVT (Timișoara), UTCN (Cluj-Napoca), TUIASI (Iași), UMFCD (Bucharest), UMF Cluj, USAMV București, UPT (Timișoara), UNITBV (Brașov), UORADEA (Oradea), USV (Suceava).

Each university needs: full name, short name, email domain (e.g., `stud.upb.ro`), city.

Each needs at least 3-5 major faculties with short names.

**Implementation approach:** Start by seeding 3-4 universities with full faculty lists (UPB, ASE, UB — these are in the mockups) for development and testing. Add the remaining ~12 universities in a follow-up commit. Use web search to verify accurate faculty names and email domains. The full seed SQL should be written as complete INSERT statements, not described in prose.

Generic checklist items (null university_id). **IMPORTANT:** Category values in the database must use English keys (`documents`, `housing`, `health`, `registration`, `campus`, `transport`) — these are mapped to Romanian labels in the frontend via `CATEGORY_LABELS` in `src/lib/constants.ts`.

1. Confirmă locul la facultate (category: `documents`, sort 1)
2. Plătește taxa de înmatriculare (category: `documents`, sort 2)
3. Fă-ți adeverința medicală (category: `health`, sort 3)
4. Depune cererea pentru cămin (category: `housing`, sort 4)
5. Activează emailul universitar (category: `registration`, sort 5)
6. Fă-ți legitimația de student (category: `campus`, sort 6)
7. Fă-ți abonamentul STB/transport redus (category: `transport`, sort 7)
8. Înscrie-te la cursuri / vezi orarul (category: `registration`, sort 8)
9. Explorează campusul (category: `campus`, sort 9)
10. Descarcă aplicațiile necesare (category: `registration`, sort 10)

- [ ] **Step 7: Apply migrations to Supabase cloud project**

```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Expected: All tables, functions, triggers, indexes, and RLS policies created successfully.

- [ ] **Step 8: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema, RLS policies, and seed data"
```

---

### Task 3: TypeScript Types & Supabase Client

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/supabase.ts`
- Create: `src/lib/supabase-server.ts`
- Create: `src/hooks.server.ts`
- Create: `src/app.d.ts`

- [ ] **Step 1: Generate TypeScript types from Supabase**

```bash
npx supabase gen types typescript --project-id <PROJECT_REF> > src/lib/database.types.ts
```

- [ ] **Step 2: Create application types `src/lib/types.ts`**

```typescript
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

export type University = Tables['universities']['Row'];
export type Faculty = Tables['faculties']['Row'];
export type Profile = Tables['profiles']['Row'];
export type QuizAnswers = Tables['quiz_answers']['Row'];
export type RoommatePreferences = Tables['roommate_preferences']['Row'];
export type ChecklistTemplate = Tables['checklist_templates']['Row'];
export type ChecklistProgress = Tables['checklist_progress']['Row'];
export type Conversation = Tables['conversations']['Row'];
export type Message = Tables['messages']['Row'];
export type Question = Tables['questions']['Row'];
export type Answer = Tables['answers']['Row'];
export type InviteCode = Tables['invite_codes']['Row'];

// Enriched types used in the UI
export type FacultyWithUniversity = Faculty & { university: University };

export type ProfileWithFaculty = Profile & {
  faculty: (Faculty & { university: University }) | null;
};

export type ChecklistItemWithProgress = ChecklistTemplate & {
  is_completed: boolean;
};

export type QuestionWithMeta = Question & {
  author: Profile | null;
  answer_count: number;
};

export type AnswerWithMeta = Answer & {
  author: Profile | null;
  voted_by_me: boolean;
};

export type ConversationWithPreview = Conversation & {
  last_message: { content: string; sender_id: string } | null;
  other_member: Profile | null; // for DMs
  unread_count?: number;
};

export type PersonWithCompatibility = Profile & {
  faculty: Faculty | null;
  quiz_answers: QuizAnswers | null;
  roommate_preferences: RoommatePreferences | null;
  compatibility_score: number | null;
};
```

- [ ] **Step 3: Create browser Supabase client `src/lib/supabase.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './database.types';

export function createClient() {
  return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}
```

- [ ] **Step 4: Create server Supabase client `src/lib/supabase-server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';
import type { Database } from './database.types';

export function createServerSupabaseClient(cookies: Cookies) {
  return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
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

- [ ] **Step 5: Create server hooks `src/hooks.server.ts`**

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

- [ ] **Step 6: Augment SvelteKit types `src/app.d.ts`**

```typescript
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';
import type { Profile } from '$lib/types';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
    }
    interface PageData {
      session: Session | null;
      user: User | null;
      profile: Profile | null;
    }
  }
}

export {};
```

- [ ] **Step 7: Verify the project still builds**

```bash
npm run build
```

Expected: Build succeeds. (The `.env` variables won't be available at build time, but the types should compile.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/ src/hooks.server.ts src/app.d.ts
git commit -m "feat: add supabase client setup, types, and server hooks"
```

---

### Task 4: Design System — Global Styles (Tailwind v4)

**Files:**
- Modify: `src/app.css`

Note: Tailwind CSS v4 uses CSS-based configuration via `@theme` directives, NOT a `tailwind.config.ts` file. The SvelteKit scaffolding with Tailwind v4 sets up `src/app.css` with the necessary imports. We configure design tokens there.

- [ ] **Step 1: Configure design tokens and global styles in `src/app.css`**

Add the Bazar design tokens via `@theme` and global base styles. Keep the existing Tailwind imports that the scaffolding created, and add below them:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

@theme {
  --color-bazar-yellow: #FFD600;
  --color-bazar-dark: #1A1A2E;
  --color-bazar-offwhite: #FAFAF7;
  --color-bazar-gray-100: #F0EFE9;
  --color-bazar-gray-200: #E5E4DD;
  --color-bazar-gray-300: #D1D0C9;
  --color-bazar-gray-500: #8A8980;
  --color-bazar-gray-700: #4A4940;
  --color-bazar-green: #22C55E;
  --color-bazar-coral: #FF5A7E;
  --color-bazar-purple: #7B61FF;
  --color-bazar-orange: #FF6B35;

  --font-heading: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --radius-bazar-sm: 12px;
  --radius-bazar-md: 16px;
  --radius-bazar-lg: 20px;
  --radius-bazar-pill: 100px;
}

body {
  font-family: var(--font-body);
  background: var(--color-bazar-offwhite);
  color: var(--color-bazar-dark);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

This makes tokens available as Tailwind utilities: `bg-bazar-yellow`, `text-bazar-dark`, `font-heading`, `rounded-bazar-md`, etc.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app.css
git commit -m "feat: add bazar design system — colors, fonts, global styles"
```

---

## Chunk 2: Auth Flow

### Task 5: Root Layout & Auth Guards

**Files:**
- Create: `src/routes/+layout.server.ts`
- Create: `src/routes/+layout.svelte`

- [ ] **Step 1: Create root server layout with auth guards `src/routes/+layout.server.ts`**

```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const publicRoutes = ['/login', '/register', '/verify-email'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session, user } = await locals.safeGetSession();

  const isPublicRoute = publicRoutes.some(r => url.pathname.startsWith(r));

  // Not logged in — allow public routes, redirect others to login
  if (!session) {
    if (!isPublicRoute && url.pathname !== '/') {
      redirect(303, '/login');
    }
    return { session, user, profile: null };
  }

  // Logged in — check for profile
  if (user) {
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('*, faculty:faculties(*, university:universities(*))')
      .eq('id', user.id)
      .single();

    // Has session but no profile — force setup (unless already there)
    if (!profile && !url.pathname.startsWith('/setup-profile')) {
      redirect(303, '/setup-profile');
    }

    // Has profile, is on a public route — redirect to app
    if (profile && isPublicRoute) {
      redirect(303, '/checklist');
    }

    return { session, user, profile };
  }

  return { session, user, profile: null };
};
```

- [ ] **Step 2: Create root layout `src/routes/+layout.svelte`**

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

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.server.ts src/routes/+layout.svelte
git commit -m "feat: add root layout with auth guards and session management"
```

---

### Task 6: Landing Page

**Files:**
- Create: `src/routes/+page.svelte`
- Create: `src/routes/+page.server.ts`

- [ ] **Step 1: Create landing page server load `src/routes/+page.server.ts`**

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { profile } = await parent();

  // Logged in with profile → go to app
  if (profile) redirect(303, '/checklist');

  // Not logged in → show landing page
  return {};
};
```

- [ ] **Step 2: Build landing page `src/routes/+page.svelte`**

A simple, warm landing page with:
- Bazar logo (ba**zar** with yellow highlight, matching mockup style)
- Headline: "Tot ce trebuie să știi înainte de facultate."
- Subtitle: "Checklist-uri, colegi de cameră, răspunsuri la întrebări stupide — totul într-un singur loc."
- Two CTAs: "Începe acum →" (link to `/register`) and "Vezi cum arată" (secondary)
- 4 feature cards: Checklist, Colegi de cameră, Chat, Întrebări
- Social proof: university badges
- Bottom CTA with dark background
- Footer

Follow the design language from the mockup `mockup/index.html` but use Tailwind classes. Use the Bazar color tokens. Keep the playful, warm personality — Space Grotesk headings, emoji feature icons, yellow highlights, large rounded corners.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte src/routes/+page.server.ts
git commit -m "feat: add landing page"
```

---

### Task 7: Auth Pages — Register, Login, Verify Email

**Files:**
- Create: `src/routes/(auth)/+layout.svelte`
- Create: `src/routes/(auth)/register/+page.svelte`
- Create: `src/routes/(auth)/login/+page.svelte`
- Create: `src/routes/(auth)/verify-email/+page.svelte`

- [ ] **Step 1: Create auth layout `src/routes/(auth)/+layout.svelte`**

Centered card layout, no nav bar. Bazar logo at top linking to `/`. Off-white background.

```svelte
<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-bazar-offwhite px-4">
  <a href="/" class="font-heading font-bold text-2xl tracking-tight mb-8 text-bazar-dark">
    ba<span class="inline-block bg-bazar-yellow px-1.5 rounded-md -rotate-2">zar</span>
  </a>
  <div class="w-full max-w-md">
    {@render children()}
  </div>
</div>
```

- [ ] **Step 2: Build register page `src/routes/(auth)/register/+page.svelte`**

Form with:
- Email input
- Password input (min 6 chars)
- "Înregistrează-te" submit button (bazar-dark background, white text)
- Google sign-in button
- Apple sign-in button
- Link to login: "Ai deja cont? Conectează-te"
- Error display

Note: Full name and invite code are collected during profile setup (Task 8), not here. Keep registration minimal.

On submit:
1. `supabase.auth.signUp({ email, password })`
2. If email/password: redirect to `/verify-email`
3. If OAuth: redirect handled by Supabase

Style: Bazar design system — rounded-bazar-md cards, white background, bazar-gray-100 border, warm feel.

- [ ] **Step 3: Build login page `src/routes/(auth)/login/+page.svelte`**

Form with:
- Email input
- Password input
- "Conectează-te" submit button
- Google sign-in button
- Apple sign-in button
- Link to register: "Nu ai cont? Înregistrează-te"
- Error display

On submit: `supabase.auth.signInWithPassword({ email, password })` → redirect to `/checklist`.

- [ ] **Step 4: Build verify email page `src/routes/(auth)/verify-email/+page.svelte`**

- Heading: "Verifică-ți emailul"
- 6-digit code input (one input, or 6 individual digit inputs for nice UX)
- "Ți-am trimis un cod de confirmare. Verifică inbox-ul (și spam-ul)."
- "Am confirmat" link to `/login`
- Resend button

On submit: `supabase.auth.verifyOtp({ email, token, type: 'signup' })` → redirect to `/setup-profile`.

- [ ] **Step 5: Commit**

```bash
git add src/routes/\(auth\)/
git commit -m "feat: add auth pages — register, login, email verification"
```

---

### Task 8: Profile Setup Flow

**Files:**
- Create: `src/routes/(auth)/setup-profile/+page.server.ts`
- Create: `src/routes/(auth)/setup-profile/+page.svelte`

- [ ] **Step 1: Create server load `src/routes/(auth)/setup-profile/+page.server.ts`**

```typescript
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: universities } = await locals.supabase
    .from('universities')
    .select('*, faculties(*)')
    .order('short_name');

  return { universities: universities ?? [] };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { session, user } = await locals.safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const fullName = formData.get('full_name') as string;
    const facultyId = formData.get('faculty_id') as string;
    const homeCity = formData.get('home_city') as string;
    const inviteCode = formData.get('invite_code') as string;

    if (!fullName || !facultyId) {
      return fail(400, { error: 'Numele și facultatea sunt obligatorii.' });
    }

    // Get faculty info for the group chat name
    const { data: faculty } = await locals.supabase
      .from('faculties')
      .select('short_name')
      .eq('id', facultyId)
      .single();

    let isVerified = false;
    let inviteCodeId: string | null = null;

    // Redeem invite code if provided (safe to call — function validates
    // max_uses and expiration; profile creation below will fail on duplicate
    // id if user tries to create multiple profiles)
    if (inviteCode) {
      const { data: codeId } = await locals.supabase.rpc('redeem_invite_code', {
        code_text: inviteCode,
      });
      if (codeId) {
        isVerified = true;
        inviteCodeId = codeId;
      }
      // Invalid code is not a blocking error — user can still create profile without verification
    }

    // Create profile
    const { error: insertError } = await locals.supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      faculty_id: facultyId,
      home_city: homeCity || null,
      is_verified: isVerified,
      invite_code_id: inviteCodeId,
    });

    if (insertError) return fail(500, { error: insertError.message });

    // Join faculty group chat
    if (faculty) {
      await locals.supabase.rpc('join_faculty_group_chat', {
        p_profile_id: user.id,
        p_faculty_id: facultyId,
        p_faculty_short_name: faculty.short_name,
      });
    }

    redirect(303, '/checklist');
  },
};
```

- [ ] **Step 2: Build setup profile page `src/routes/(auth)/setup-profile/+page.svelte`**

Multi-step form (no page reload, just client-side step switching):

**Step 1:** "La ce universitate ești?" — grid of university cards. Click to select → shows faculties below.
**Step 2:** "Facultatea ta:" — grid of faculty cards for selected university.
**Step 3:** "De unde ești?" — text input for home city + optional invite code field.
**Step 4:** Submit via form action.

Progress indicator (step dots or progress bar) at top.

Style: Large clickable cards with bazar-gray-100 borders, bazar-yellow highlight on selected. Smooth transitions. Warm, playful.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(auth\)/setup-profile/
git commit -m "feat: add profile setup flow with university selection and invite codes"
```

---

## Chunk 3: App Shell & Checklist

### Task 9: App Shell — Navigation

**Files:**
- Create: `src/routes/(app)/+layout.svelte`
- Create: `src/lib/components/NavBar.svelte`

- [ ] **Step 1: Build NavBar component `src/lib/components/NavBar.svelte`**

**Desktop (≥768px):** Fixed sidebar (260px), white background, bazar-gray-100 border-right.
- Bazar logo at top
- 5 nav links: Checklist 📋, Oameni 👥, Mesaje 💬, Întrebări ❓, Profil 👤
- Active link: bazar-dark background, white text, rounded-bazar-sm
- Inactive: bazar-gray-500, hover bazar-gray-100 background
- User profile at bottom: avatar (initials with gradient), name, faculty, verified badge

**Mobile (<768px):** Fixed bottom tab bar.
- 5 tabs matching desktop nav
- Active: bazar-dark text, inactive: bazar-gray-500
- Emoji icons at 22px, labels at 10px

Props needed: `profile` (Profile with faculty), `currentPath` (string).

Use `$app/state` `page` for current path detection.

- [ ] **Step 2: Create app layout `src/routes/(app)/+layout.svelte`**

```svelte
<script lang="ts">
  import NavBar from '$lib/components/NavBar.svelte';

  let { data, children } = $props();
</script>

<div class="md:flex min-h-screen bg-bazar-offwhite">
  <NavBar profile={data.profile} />
  <main class="flex-1 md:ml-[260px] pb-20 md:pb-0">
    {@render children()}
  </main>
</div>
```

Also add a mobile header (visible only on mobile): Bazar logo + user avatar.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/+layout.svelte src/lib/components/NavBar.svelte
git commit -m "feat: add app shell with responsive navigation"
```

---

### Task 10: Checklist Page

**Files:**
- Create: `src/lib/components/ChecklistItem.svelte`
- Create: `src/routes/(app)/checklist/+page.server.ts`
- Create: `src/routes/(app)/checklist/+page.svelte`

- [ ] **Step 1: Create checklist server load `src/routes/(app)/checklist/+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { user, profile } = await parent();
  if (!user || !profile?.faculty_id) return { items: [] };

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
      .or(`university_id.eq.${faculty.university_id},university_id.is.null`)
      .order('sort_order'),
    locals.supabase
      .from('checklist_progress')
      .select('*')
      .eq('profile_id', user.id),
  ]);

  const progressMap = new Map(
    (progress ?? []).map((p) => [p.template_id, p])
  );

  const items = (templates ?? []).map((t) => ({
    ...t,
    is_completed: progressMap.get(t.id)?.is_completed ?? false,
  }));

  return { items };
};
```

- [ ] **Step 2: Build ChecklistItem component `src/lib/components/ChecklistItem.svelte`**

Props: `id`, `title`, `description`, `category`, `deadline_description`, `url`, `is_completed`, `onToggle` callback.

Visual design matching mockup `mockup/checklist.html`:
- White card with bazar-gray-100 border, rounded-bazar-md
- Checkbox: 24px, rounded-lg, green when checked
- Title with strikethrough when completed
- Category pill (colored per category — use colors from spec)
- Deadline text in bazar-gray-500
- Expand/collapse chevron on right
- Details section with description and optional "Link util →" link
- Completed items: opacity-55, hover opacity-75

Category colors map:
```typescript
const categoryColors: Record<string, { bg: string; text: string }> = {
  documents: { bg: 'bg-blue-100', text: 'text-blue-800' },
  housing: { bg: 'bg-green-100', text: 'text-green-800' },
  registration: { bg: 'bg-purple-100', text: 'text-purple-800' },
  campus: { bg: 'bg-amber-100', text: 'text-amber-800' },
  transport: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  health: { bg: 'bg-rose-100', text: 'text-rose-800' },
};

const categoryLabels: Record<string, string> = {
  documents: 'Acte',
  housing: 'Cazare',
  registration: 'Înregistrare',
  campus: 'Campus',
  transport: 'Transport',
  health: 'Sănătate',
};
```

- [ ] **Step 3: Build checklist page `src/routes/(app)/checklist/+page.svelte`**

- Page header: "Checklist-ul tău" (h1, Space Grotesk) + subtitle with university/faculty name
- Progress section: white card, progress bar (green fill), "X din Y completate", encouraging message
- Category filter pills: "Toate" + each category. Active = bazar-dark bg, white text. Inactive = white bg, bazar-gray-200 border.
- List of ChecklistItem components
- Optimistic toggle: on checkbox click, update local state immediately, then upsert to Supabase

Toggle handler:
```typescript
async function handleToggle(templateId: string) {
  const item = items.find(i => i.id === templateId);
  if (!item) return;
  const newCompleted = !item.is_completed;

  // Optimistic update
  items = items.map(i =>
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
```

- [ ] **Step 4: Verify checklist works end-to-end**

```bash
npm run dev
```

Expected: Register → setup profile → land on checklist with items loaded. Toggling checkboxes persists to database.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ChecklistItem.svelte src/routes/\(app\)/checklist/
git commit -m "feat: add onboarding checklist with progress tracking"
```

---

## Chunk 4: Compatibility Quiz & People

### Task 11: Matching Algorithm (TDD)

**Files:**
- Create: `src/lib/matching.ts`
- Create: `src/lib/constants.ts`
- Create: `tests/unit/matching.test.ts`

- [ ] **Step 1: Write failing tests `tests/unit/matching.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateCompatibility } from '$lib/matching';
import type { QuizAnswers } from '$lib/types';

const base: QuizAnswers = {
  profile_id: 'a',
  sleep_schedule: 3,
  cleanliness: 4,
  noise_tolerance: 2,
  guests_frequency: 2,
  smoking: 0,
  pets: 0,
  study_vs_social: 3,
  updated_at: '',
};

describe('calculateCompatibility', () => {
  it('returns 100 for identical profiles', () => {
    expect(calculateCompatibility(base, { ...base, profile_id: 'b' })).toBe(100);
  });

  it('returns null if either has no answers', () => {
    const empty: QuizAnswers = {
      profile_id: 'b',
      sleep_schedule: null, cleanliness: null, noise_tolerance: null,
      guests_frequency: null, smoking: null, pets: null, study_vs_social: null,
      updated_at: '',
    };
    expect(calculateCompatibility(base, empty)).toBeNull();
  });

  it('penalizes smoking mismatch (0 vs 2) heavily', () => {
    const smoker = { ...base, profile_id: 'b', smoking: 2 };
    expect(calculateCompatibility(base, smoker)).toBeLessThan(70);
  });

  it('gives partial credit for adjacent smoking (0 vs 1)', () => {
    const outsideSmoker = { ...base, profile_id: 'b', smoking: 1 };
    const fullSmoker = { ...base, profile_id: 'c', smoking: 2 };
    const scoreOutside = calculateCompatibility(base, outsideSmoker)!;
    const scoreFull = calculateCompatibility(base, fullSmoker)!;
    expect(scoreOutside).toBeGreaterThan(scoreFull);
  });

  it('scores higher for similar cleanliness', () => {
    const clean = { ...base, profile_id: 'b', cleanliness: 4 };
    const messy = { ...base, profile_id: 'c', cleanliness: 1 };
    const scoreClean = calculateCompatibility(base, clean)!;
    const scoreMessy = calculateCompatibility(base, messy)!;
    expect(scoreClean).toBeGreaterThan(scoreMessy);
  });

  it('handles pets mismatch with low similarity', () => {
    const petOwner = { ...base, profile_id: 'b', pets: 1 };
    const noPets = { ...base, profile_id: 'a', pets: 0 };
    const score = calculateCompatibility(noPets, petOwner)!;
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(0);
  });

  it('returns value between 0 and 100', () => {
    const opposite: QuizAnswers = {
      profile_id: 'b',
      sleep_schedule: 1, cleanliness: 1, noise_tolerance: 5,
      guests_frequency: 5, smoking: 2, pets: 1, study_vs_social: 1,
      updated_at: '',
    };
    const score = calculateCompatibility(base, opposite)!;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/unit/matching.test.ts
```

Expected: FAIL — module `$lib/matching` not found.

- [ ] **Step 3: Implement `src/lib/matching.ts`**

```typescript
import type { QuizAnswers } from './types';

const WEIGHTS = {
  sleep_schedule: 3,
  cleanliness: 4,
  noise_tolerance: 3,
  guests_frequency: 2,
  study_vs_social: 2,
  smoking: 5,
  pets: 3,
} as const;

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

  // Scale fields: similarity = 1 - |a - b| / (max - 1)
  for (const field of SCALE_FIELDS) {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal === null || bVal === null) continue;

    const diff = Math.abs(aVal - bVal);
    const similarity = 1 - diff / (MAX_SCALE - 1);
    weightedScore += similarity * WEIGHTS[field];
    totalWeight += WEIGHTS[field];
  }

  // Smoking: 3-value (0, 1, 2)
  if (a.smoking !== null && b.smoking !== null) {
    let similarity: number;
    if (a.smoking === b.smoking) similarity = 1;
    else if ((a.smoking === 0 && b.smoking === 2) || (a.smoking === 2 && b.smoking === 0)) similarity = 0;
    else similarity = 0.3; // adjacent: 0↔1 or 1↔2
    weightedScore += similarity * WEIGHTS.smoking;
    totalWeight += WEIGHTS.smoking;
  }

  // Pets: binary (0, 1)
  if (a.pets !== null && b.pets !== null) {
    const similarity = a.pets === b.pets ? 1 : 0.2;
    weightedScore += similarity * WEIGHTS.pets;
    totalWeight += WEIGHTS.pets;
  }

  if (totalWeight === 0) return null;
  return Math.round((weightedScore / totalWeight) * 100);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/unit/matching.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Create constants `src/lib/constants.ts`**

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
] as const;

export const BUCHAREST_SECTORS = [
  'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6',
  'Militari', 'Drumul Taberei', 'Titan', 'Colentina', 'Rahova', 'Cotroceni', 'Regie',
];

export const CATEGORY_LABELS: Record<string, string> = {
  documents: 'Acte',
  housing: 'Cazare',
  registration: 'Înregistrare',
  campus: 'Campus',
  transport: 'Transport',
  health: 'Sănătate',
};
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/matching.ts src/lib/constants.ts tests/unit/matching.test.ts
git commit -m "feat: add compatibility scoring algorithm with tests"
```

---

### Task 12: Lifestyle Quiz Page

**Files:**
- Create: `src/routes/(app)/quiz/+page.server.ts`
- Create: `src/routes/(app)/quiz/+page.svelte`

- [ ] **Step 1: Create quiz server load `src/routes/(app)/quiz/+page.server.ts`**

Load existing quiz answers (if any) so the UI can pre-populate when retaking:

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { user } = await parent();
  if (!user) return { existingAnswers: null };

  const { data: existing } = await locals.supabase
    .from('quiz_answers')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  return { existingAnswers: existing };
};
```

- [ ] **Step 2: Build quiz page**

One question at a time. Visual design:
- Progress bar at top (thin, bazar-yellow fill)
- Question counter: "3 / 7"
- Question text: large, Space Grotesk bold
- **Slider questions:** Custom styled range input. Labels below at each position. Current value highlighted.
- **Choice questions:** Large clickable cards (white, rounded-bazar-md, bazar-gray-100 border, bazar-yellow border when selected)
- Navigation: "Înapoi" (ghost button) + "Continuă" (bazar-dark solid button), "Gata!" on last question
- If `data.existingAnswers` exists, pre-populate `answers` state with existing values.
- On final submit: `supabase.from('quiz_answers').upsert({ profile_id, ...answers })` → redirect to `/people`

Follow the warm/playful design system. Make the slider feel fun, not corporate.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/quiz/
git commit -m "feat: add lifestyle quiz with step-by-step flow"
```

---

### Task 13: People & Roommate Search

**Files:**
- Create: `src/lib/components/ProfileCard.svelte`
- Create: `src/lib/components/CompatibilityBadge.svelte`
- Create: `src/lib/components/FilterDrawer.svelte`
- Create: `src/routes/(app)/people/+page.server.ts`
- Create: `src/routes/(app)/people/+page.svelte`
- Create: `src/routes/(app)/people/[id]/+page.server.ts`
- Create: `src/routes/(app)/people/[id]/+page.svelte`

- [ ] **Step 1: Build CompatibilityBadge `src/lib/components/CompatibilityBadge.svelte`**

Small pill showing "X% compatibil". Color-coded:
- ≥75: green background/text
- 50-74: amber background/text
- <50: red background/text
- null: don't render

- [ ] **Step 2: Build ProfileCard `src/lib/components/ProfileCard.svelte`**

Card showing:
- Avatar circle (initials with gradient if no avatar_url, image if yes)
- Full name (bold)
- Faculty short name + university short name
- Home city (if set)
- CompatibilityBadge (if score available)
- "Caută coleg" tag if roommate_preferences exists
- Links to `/people/{id}`

White card, rounded-bazar-md, bazar-gray-100 border, hover elevation.

- [ ] **Step 3: Build FilterDrawer `src/lib/components/FilterDrawer.svelte`**

Slide-in drawer from right (mobile: full screen overlay).
- Budget range: min/max number inputs
- Sector: multi-select chips from BUCHAREST_SECTORS
- Move-in month: select dropdown
- Gender preference: radio (Oricine / Masculin / Feminin)
- Has apartment: toggle
- "Only with quiz completed" toggle
- "Aplică" and "Resetează" buttons

Applies filters as URL search params.

- [ ] **Step 4: Create people server load `src/routes/(app)/people/+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { user } = await parent();
  if (!user) return { people: [], myQuiz: null };

  const { data: myQuiz } = await locals.supabase
    .from('quiz_answers')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  const { data: people } = await locals.supabase
    .from('profiles')
    .select('*, faculty:faculties(short_name, university_id, university:universities(short_name)), quiz_answers(*), roommate_preferences(*)')
    .eq('is_active', true)
    .eq('is_verified', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false });

  return { people: people ?? [], myQuiz };
};
```

- [ ] **Step 5: Build people page `src/routes/(app)/people/+page.svelte`**

- Two tabs: "Toți" and "Caută coleg de cameră"
- Grid of ProfileCards (2 columns desktop, 1 mobile)
- Compatibility calculated client-side using `calculateCompatibility(myQuiz, person.quiz_answers)`
- Roommate tab: sort by compatibility descending, only show those with roommate_preferences
- Filter button → opens FilterDrawer
- If user hasn't taken quiz: banner "Completează quiz-ul pentru a vedea compatibilitatea" linking to `/quiz`
- If user is not verified: show a banner "Verifică-te pentru a apărea în listări și a trimite mesaje" linking to `/profile`. People page is still accessible (browse-only) per spec auth guards.

- [ ] **Step 6: Build person detail page**

Create `src/routes/(app)/people/[id]/+page.server.ts` to load the person's full profile, quiz answers, and roommate preferences.

Create `src/routes/(app)/people/[id]/+page.svelte`:
- Full profile view: large avatar, name, bio, faculty, year, home city
- If both took quiz: compatibility score + breakdown per dimension (visual bars showing each dimension similarity)
- Roommate preferences section: budget, area, timing
- "Trimite mesaj" button — for now, link to `/messages` (the conversation API route is created in Task 14). The button should call `fetch('/api/conversations', { method: 'POST', body: JSON.stringify({ other_user_id: person.id }) })` to get/create the DM, then navigate to `/messages/{conversation_id}`. Wire this up fully after Task 14 is complete.
- Only shown to verified users. Unverified see a "Verifică-te pentru a vedea profilul complet" message.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/ProfileCard.svelte src/lib/components/CompatibilityBadge.svelte src/lib/components/FilterDrawer.svelte src/routes/\(app\)/people/
git commit -m "feat: add people browsing with compatibility scores and filters"
```

---

## Chunk 5: Messaging

### Task 14: Conversations & Chat

**Files:**
- Create: `src/routes/api/conversations/+server.ts`
- Create: `src/lib/components/MessageBubble.svelte`
- Create: `src/routes/(app)/messages/+page.server.ts`
- Create: `src/routes/(app)/messages/+page.svelte`
- Create: `src/routes/(app)/messages/[id]/+page.server.ts`
- Create: `src/routes/(app)/messages/[id]/+page.svelte`

- [ ] **Step 1: Create conversation API route `src/routes/api/conversations/+server.ts`**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { other_user_id } = await request.json();
  const { session } = await locals.safeGetSession();
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  // Messaging requires verification
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('is_verified')
    .eq('id', session.user.id)
    .single();
  if (!profile?.is_verified) return json({ error: 'Verification required' }, { status: 403 });

  const { data: conversationId, error } = await locals.supabase.rpc('get_or_create_dm', {
    user_a: session.user.id,
    user_b: other_user_id,
  });

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ conversation_id: conversationId });
};
```

- [ ] **Step 2: Build MessageBubble `src/lib/components/MessageBubble.svelte`**

Props: `content`, `sender_name`, `is_mine`, `timestamp`, `show_sender`.

- Mine: right-aligned, bazar-dark background, white text, rounded-2xl (bottom-right less rounded)
- Theirs: left-aligned, white background, bazar-dark text, rounded-2xl (bottom-left less rounded)
- Sender name (in group chats): small text above bubble in bazar-gray-500
- Timestamp: tiny text below bubble in bazar-gray-500

- [ ] **Step 3: Build conversations list page**

`src/routes/(app)/messages/+page.server.ts`: Load all conversations user is a member of, with last message and other participant info.

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { user } = await parent();
  if (!user) return { conversations: [] };

  // Get conversations with members and last message
  const { data: memberships } = await locals.supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', user.id);

  if (!memberships?.length) return { conversations: [] };

  const convIds = memberships.map(m => m.conversation_id);

  const { data: conversations } = await locals.supabase
    .from('conversations')
    .select('*, conversation_members(profile_id, profile:profiles(full_name, avatar_url, faculty_id))')
    .in('id', convIds)
    .order('last_message_at', { ascending: false });

  // Get last message for each conversation
  const conversationsWithPreview = await Promise.all(
    (conversations ?? []).map(async (conv) => {
      const { data: lastMsg } = await locals.supabase
        .from('messages')
        .select('content, sender_id, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const otherMember = conv.conversation_members
        ?.find((m: any) => m.profile_id !== user.id)?.profile ?? null;

      return { ...conv, last_message: lastMsg, other_member: otherMember };
    })
  );

  return { conversations: conversationsWithPreview };
};
```

`src/routes/(app)/messages/+page.svelte`:
- Faculty group chats section at top ("Grupuri")
- DM conversations below, sorted by last_message_at
- Each conversation row: avatar/initials, name (or group name), last message preview, time
- Click → navigate to `/messages/{id}`
- Empty state: "Niciun mesaj. Caută colegi și trimite primul mesaj!"

- [ ] **Step 4: Build chat screen**

`src/routes/(app)/messages/[id]/+page.server.ts`: Load conversation info + initial messages (latest 50).

`src/routes/(app)/messages/[id]/+page.svelte`:
- Header: conversation name (or other person's name for DMs), back button
- Message list: scrollable, auto-scroll to bottom
- Real-time subscription:
  ```typescript
  const channel = supabase
    .channel(`chat-${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => {
      messages = [...messages, payload.new as Message];
    })
    .subscribe();
  ```
- Text input + send button at bottom. On send: insert to `messages` table. Hide the input and show "Verifică-te pentru a trimite mesaje" if user is not verified.
- Show sender name in group chats, hide in direct.
- Clean up subscription on unmount.
- Note: The `messages` RLS insert policy checks conversation membership but not verification status. The UI-level guard is the primary enforcement. For defense in depth, add an RLS check for `is_verified` on the messages insert policy in the RLS migration.

- [ ] **Step 5: Verify messaging works end-to-end**

Test with two browser windows (two different accounts). Send messages, verify real-time delivery.

- [ ] **Step 6: Commit**

```bash
git add src/routes/api/conversations/ src/lib/components/MessageBubble.svelte src/routes/\(app\)/messages/
git commit -m "feat: add real-time messaging with DMs and group chats"
```

---

## Chunk 6: Q&A Board

### Task 15: Questions & Answers

**Files:**
- Create: `src/lib/components/QuestionCard.svelte`
- Create: `src/routes/(app)/qa/+page.server.ts`
- Create: `src/routes/(app)/qa/+page.svelte`
- Create: `src/routes/(app)/qa/ask/+page.server.ts`
- Create: `src/routes/(app)/qa/ask/+page.svelte`
- Create: `src/routes/(app)/qa/[id]/+page.server.ts`
- Create: `src/routes/(app)/qa/[id]/+page.svelte`

- [ ] **Step 1: Build QuestionCard `src/lib/components/QuestionCard.svelte`**

Card showing:
- Title (bold, linked to `/qa/{id}`)
- Author name + year badge ("Anul 3" in a small colored pill — higher years get bazar-green, year 1 gets bazar-gray)
- Faculty tag (if faculty-specific)
- Answer count: "X răspunsuri"
- Relative time ("acum 2h", "ieri", etc.)
- Pinned indicator if is_pinned

- [ ] **Step 2: Build Q&A list page**

`src/routes/(app)/qa/+page.server.ts`: Load questions with author profile and answer count.

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile } = await parent();

  const { data: questions } = await locals.supabase
    .from('questions')
    .select('*, author:profiles(full_name, year, faculty_id), answers(count)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  // Note: Supabase PostgREST returns count as `question.answers[0].count`.
  // Map it in the template: `question.answers?.[0]?.count ?? 0`

  return { questions: questions ?? [], userFacultyId: profile?.faculty_id };
};
```

`src/routes/(app)/qa/+page.svelte`:
- Filter tabs: "Toate" / "Facultatea mea" / "Generale"
- List of QuestionCards
- Floating "Întreabă" button (bazar-dark, rounded-full, fixed bottom-right on mobile, absolute on desktop) → links to `/qa/ask`
- If not verified: "Verifică-te pentru a pune întrebări" banner, but can still read

- [ ] **Step 3: Build ask question page**

Create `src/routes/(app)/qa/ask/+page.server.ts` with:
- `load` function: check if user is verified. If not, redirect to `/qa`.
- `actions.default`: validate form data, insert into `questions`, redirect to `/qa/{new_id}`.

```typescript
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const { profile } = await parent();
  if (!profile?.is_verified) redirect(303, '/qa');
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const form = await request.formData();
    const title = form.get('title') as string;
    const body = form.get('body') as string;
    const facultyId = form.get('faculty_id') as string;

    if (!title?.trim()) return fail(400, { error: 'Titlul este obligatoriu.' });

    const { data: question, error } = await locals.supabase
      .from('questions')
      .insert({
        author_id: user.id,
        title: title.trim(),
        body: body?.trim() || null,
        faculty_id: facultyId || null,
      })
      .select('id')
      .single();

    if (error) return fail(500, { error: error.message });
    redirect(303, `/qa/${question.id}`);
  },
};
```

Create `src/routes/(app)/qa/ask/+page.svelte` with form:
- Title input (required)
- Body textarea (optional)
- Faculty select (optional — "General" default, or pick a faculty)
- "Publică" button
- Uses SvelteKit form action (progressive enhancement)

- [ ] **Step 4: Build question detail page**

`src/routes/(app)/qa/[id]/+page.server.ts`: Load question + answers with authors and vote status. Also provide a form action for submitting new answers (server-side insert, verifies user is authenticated and verified).

`src/routes/(app)/qa/[id]/+page.svelte`:
- Question title + body at top
- Author with year badge
- Answer list sorted by upvotes descending
- Each answer: author name + year badge, body, upvote button with count, relative time
- Upvote toggle: insert/delete `answer_votes`, UI updates optimistically
- Answer input at bottom (textarea + "Răspunde" button)
- Only verified users can answer/upvote

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/QuestionCard.svelte src/routes/\(app\)/qa/
git commit -m "feat: add Q&A board with answers and upvoting"
```

---

## Chunk 7: Profile & Polish

### Task 16: Profile Page

**Files:**
- Create: `src/routes/(app)/profile/+page.server.ts`
- Create: `src/routes/(app)/profile/+page.svelte`

- [ ] **Step 1: Create profile server load `src/routes/(app)/profile/+page.server.ts`**

Load user's profile, quiz answers, roommate preferences. Also handle form actions for:
- Updating profile (name, bio, home city)
- Updating roommate preferences
- Deactivating from roommate search
- Signing out

- [ ] **Step 2: Build profile page `src/routes/(app)/profile/+page.svelte`**

Sections:
1. **Header:** Large avatar (initials with gradient for now — avatar upload via Supabase Storage is deferred to post-MVP), name, faculty + university, verified badge
2. **Edit profile:** Inline editable fields — full name, bio (textarea), home city. Save button per section.
3. **University verification:** If not verified: "Verifică-te cu emailul universitar" → input for uni email → sends code → verify code → badge appears. If verified: shows green badge + uni email.
4. **Quiz:** "Completează quiz-ul" link if not taken, "Refă quiz-ul" if taken (with current answers summary)
5. **Roommate preferences:** Budget (min-max), preferred sectors (chip multi-select), move-in month (select), gender preference (radio), has apartment (toggle + link input). Save button.
6. **"Am găsit coleg de cameră!"** button → confirmation dialog → sets `is_active = false`
7. **Sign out** button at bottom

Style: Cards for each section, consistent with Bazar design system.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/profile/
git commit -m "feat: add profile page with edit and roommate preferences"
```

---

### Task 17: University Email Verification Edge Function

**Files:**
- Create: `supabase/functions/verify-university-email/index.ts`

- [ ] **Step 1: Create Edge Function**

Two endpoints (or two actions via request body):

**`send-code`:**
1. Validate user is authenticated
2. Validate email domain matches a known university email_domain
3. Check rate limit: max 3 codes per user per hour (query `university_email_verifications` for recent entries)
4. Generate 6-digit numeric code
5. Insert into `university_email_verifications`
6. Send email via Supabase's built-in email (or a simple SMTP call)
7. Return success

**`verify-code`:**
1. Validate user is authenticated
2. Find latest non-expired, non-verified verification for this user
3. Check attempts < 5
4. Compare code
5. If match: set verified = true, update profile (is_verified = true, university_email = email)
6. If no match: increment attempts, return error
7. Return success/failure

- [ ] **Step 2: Deploy Edge Function**

```bash
npx supabase functions deploy verify-university-email
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/
git commit -m "feat: add university email verification edge function"
```

---

## Chunk 8: Deployment & CI

### Task 18: Cloudflare Pages Deployment

- [ ] **Step 1: Build and deploy**

```bash
npm run build
npx wrangler pages project create bazar
npx wrangler pages deploy .svelte-kit/cloudflare
```

- [ ] **Step 2: Set environment variables**

In Cloudflare Pages dashboard → Settings → Environment variables:
- `PUBLIC_SUPABASE_URL` = project URL
- `PUBLIC_SUPABASE_ANON_KEY` = anon key

- [ ] **Step 3: Connect GitHub repo for auto-deploy**

In Cloudflare Pages dashboard, connect the GitHub repo. Build command: `npm run build`, output directory: `.svelte-kit/cloudflare`.

- [ ] **Step 4: Configure Supabase Auth redirect URLs**

In Supabase dashboard → Auth → URL Configuration:
- Site URL: `https://bazar.pages.dev` (or custom domain)
- Redirect URLs: add the production URL

Also configure Google and Apple OAuth providers in Supabase Auth settings.

- [ ] **Step 5: Verify production deployment**

Visit the deployed URL. Test: register, setup profile, checklist, messaging.

- [ ] **Step 6: Commit any config changes**

```bash
git add wrangler.toml
git commit -m "chore: configure cloudflare pages deployment"
```

---

### Task 19: GitHub Actions CI

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
          node-version: 22
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
| 1 — Scaffolding & Schema | Tasks 1-4 | SvelteKit project, Supabase DB, types, design system |
| 2 — Auth Flow | Tasks 5-8 | Login, register, email verify, profile setup, auth guards |
| 3 — App Shell & Checklist | Tasks 9-10 | Navigation, checklist with progress |
| 4 — Quiz & People | Tasks 11-13 | Matching algorithm (TDD), quiz, people browsing |
| 5 — Messaging | Task 14 | Real-time DMs + group chats |
| 6 — Q&A | Task 15 | Question board with answers + upvoting |
| 7 — Profile & Polish | Tasks 16-17 | Profile editing, university verification |
| 8 — Deploy & CI | Tasks 18-19 | Cloudflare Pages, GitHub Actions |

**Total: 19 tasks across 8 chunks.**
