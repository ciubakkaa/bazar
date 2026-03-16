# Bazar — Design Spec

> "bazarul studenților" — everything incoming Romanian university students need, in one place.

## Product Overview

Bazar is a web app that helps incoming university students in Romania navigate onboarding (checklists of deadlines & tasks), find compatible roommates, meet classmates, and get answers from upperclassmen.

**Target users:** Romanian students admitted to university, primarily in the weeks/months before and during their first semester.

**Core value:** Reduce the chaos of starting university. One app instead of 15 scattered websites, Facebook groups, and WhatsApp chains.

## Modules

### 1. Checklist

The entry point and hook. A step-by-step onboarding guide personalized per university.

- Template items stored in DB, some generic (apply to all universities), some university-specific
- Categories: Acte, Cazare, Înregistrare, Campus, Transport, Sănătate
- Each item: title, description, category, deadline hint, optional external URL
- Progress bar showing completion percentage
- Category filter pills
- Expandable items — click to reveal description + links
- Optimistic checkbox toggle, persisted via upsert to `checklist_progress`
- This is the default landing page after login — low friction, immediately useful

### 2. People & Roommates

Browse verified students and find compatible roommates.

- **Two tabs:** "Toți" (all verified students) and "Caută coleg" (roommate search — only those with roommate preferences set)
- **Lifestyle quiz:** 7 questions presented one at a time:
  - Sleep schedule (1-5 scale)
  - Cleanliness (1-5 scale)
  - Noise tolerance (1-5 scale)
  - Guest frequency (1-5 scale)
  - Smoking (no / outside only / yes)
  - Pets (no / yes)
  - Study vs social (1-5 scale)
- **Compatibility score:** Weighted algorithm, calculated client-side. Returns 0-100 integer, or null if either user hasn't answered any questions. Formula:

  ```
  For each scale field (sleep, cleanliness, noise, guests, study_vs_social):
    similarity = 1 - |a - b| / (max - 1)    // max=5, so divisor=4
    weightedScore += similarity * weight

  For smoking (0/1/2):
    same value → similarity = 1
    0 vs 2 (non-smoker vs smoker) → similarity = 0
    adjacent (0↔1 or 1↔2) → similarity = 0.3
    weightedScore += similarity * weight(5)

  For pets (0/1):
    same value → similarity = 1
    different → similarity = 0.2
    weightedScore += similarity * weight(3)

  finalScore = round(weightedScore / totalWeight * 100)
  ```

  Weights: cleanliness (4), smoking (5), sleep (3), noise (3), pets (3), guests (2), study_vs_social (2). Total max weight = 22.
- **Profile cards:** Avatar/initials, name, faculty short name, home city, compatibility badge (color-coded: green 75+, yellow 50-74, red <50)
- **Filter drawer:** Budget range, area/sector multi-select, move-in month, gender preference, "has apartment" toggle
- **Person detail page:** Full profile, compatibility breakdown per dimension, roommate preferences, "Trimite mesaj" button
- Requires verification to appear in listings and to message

### 3. Messaging

Real-time direct messages and faculty group chats.

- **Direct messages:** Initiated from a person's profile ("Trimite mesaj"). Creates or finds existing conversation.
- **Faculty group chats:** Auto-created when the first student from a faculty completes profile setup. All subsequent students from that faculty are auto-joined. Named like "ACS — Anul 1".
- **Real-time:** Supabase Realtime subscriptions on `messages` table, filtered by `conversation_id`.
- **Conversation list:** Sorted by `last_message_at` (denormalized on conversations table). Shows other participant's name/avatar (DM) or group name, plus last message preview.
- **Chat screen:** Message bubbles (blue = mine, gray = theirs), sender name shown in group chats, auto-scroll to newest, text input + send at bottom.
- Requires verification.

### 4. Q&A

Question board where freshmen ask and upperclassmen answer.

- Questions have: title, optional body, optional faculty tag, author with year badge
- Year badge (e.g., "Anul 3") signals experience/trustworthiness
- Answers sorted by upvotes (descending)
- One upvote per user per answer, toggle on/off
- Pinned questions for FAQ-type content
- Filter tabs: "Toate" / "Facultatea mea" / "Generale"
- Floating "Întreabă" button to post new question
- Readable by all authenticated users. Posting requires verification.

### 5. Profile

User's own profile with edit-in-place.

- Avatar (upload to Supabase Storage, placeholder initials if none)
- Full name, bio, home city (editable)
- Faculty + university (read-only after setup)
- University email verification flow (enter uni email → receive 6-digit numeric code → verify → badge). Rate limits: max 3 codes per user per hour, max 5 verification attempts per code, codes expire after 10 minutes.
- Roommate preferences section: budget range, preferred areas, move-in month, gender pref, has apartment toggle + link
- Quiz: "Completează quiz-ul" or "Refă quiz-ul" link
- "Am găsit coleg de cameră!" → sets is_active = false, removes from roommate listings
- Sign out

## Auth Flow

### Registration

Multiple sign-up methods:
- Email + password
- Google OAuth
- Apple OAuth

Optional `invite_code` field at registration. Valid invite code → auto-verified.

### Email Verification (for email/password signups)

1. User submits registration form
2. Supabase Auth sends 6-digit OTP to provided email
3. User enters code on verification screen
4. Account activated, redirected to profile setup

### Profile Setup (all auth methods)

1. Select university (list of ~15 major Romanian universities)
2. Select faculty (filtered by chosen university)
3. Enter home city (optional)
4. Profile created → auto-joined to faculty group chat → redirect to `/checklist`

### University Email Verification (separate, post-registration)

1. User goes to profile → "Verifică-te cu emailul universitar"
2. Enters `@stud.*.ro` email address
3. Edge Function validates domain against known university domains, generates 6-digit numeric code, stores in `university_email_verifications`, sends email. Rate limit: max 3 codes per user per hour. Code expires after 10 minutes.
4. User enters code (max 5 attempts per code) → `is_verified = true`, `university_email` saved on profile
5. Unlocks: verified badge, messaging, appearing in roommate search, posting Q&A

### Invite Codes (alternative verification)

- Distributed via student associations (LSAC, ASMI, etc.), orientation events, QR codes
- Each code tied to a university + source (e.g., "LSAC-UPB-2026")
- Valid code at registration → auto-verified, no university email needed
- Codes can have usage limits and expiration dates

### Auth Guards

| State | Access |
|-------|--------|
| Not logged in | Redirect to `/login` |
| Logged in, no profile | Redirect to `/setup-profile` |
| Logged in, not verified | Checklist (full), Q&A (read-only), People (browse only) |
| Logged in, verified | Full access to all features |

## Tech Stack

- **Framework:** SvelteKit + TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn-svelte (Bits UI primitives), heavily customized
- **Backend:** Supabase (Auth with email/Google/Apple, PostgreSQL, Realtime, Storage, Edge Functions)
- **Deployment:** Cloudflare Pages (frontend) + Supabase Cloud (backend)
- **Testing:** Vitest (unit) + Playwright (e2e)
- **CI:** GitHub Actions (lint + type-check + test + build)
- **Repo:** GitHub (private)

## Design System

### Visual Identity

- **Personality:** Warm, playful, approachable. Feels like something a student built, not a corporate template. Not "AI-generated" glossy.
- **Font — headings:** Space Grotesk (700 weight) — geometric, modern, slightly quirky
- **Font — body:** Inter (400, 500, 600) — clean, readable
- **Border radius:** Large everywhere — 12px for small elements, 16-20px for cards, 100px for pills/badges
- **Shadows:** Subtle, warm — no harsh drop shadows
- **Borders:** Soft, 2px, using gray-100/gray-200 tones
- **Icons:** Emoji-based in navigation and feature highlights (not an icon library)

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--yellow` | `#FFD600` | Primary accent, logo highlight, CTA hover |
| `--dark` | `#1A1A2E` | Text, dark backgrounds, primary buttons |
| `--off-white` | `#FAFAF7` | Page background |
| `--gray-100` | `#F0EFE9` | Card backgrounds, borders |
| `--gray-300` | `#D1D0C9` | Secondary borders, unchecked states |
| `--gray-500` | `#8A8980` | Secondary text, timestamps |
| `--gray-700` | `#4A4940` | Body text |
| `--green` | `#22C55E` | Success, completed, verified badge |
| `--coral` | `#FF5A7E` | Notification badges, alerts |
| `--purple` | `#7B61FF` | Links, interactive accents |
| `--orange` | `#FF6B35` | Secondary accent |

### Category Tag Colors

| Category | Background | Text |
|----------|-----------|------|
| Acte (documents) | `#DBEAFE` | `#1E40AF` |
| Cazare (housing) | `#DCFCE7` | `#166534` |
| Înregistrare (registration) | `#F3E8FF` | `#6B21A8` |
| Campus | `#FEF3C7` | `#92400E` |
| Transport | `#CFFAFE` | `#155E75` |
| Sănătate (health) | `#FFE4E6` | `#9F1239` |

### Layout

- **Desktop:** Side navigation (260px) + main content area (max-width ~780px)
- **Mobile:** Top header bar + bottom tab navigation (5 tabs: Checklist, Oameni, Mesaje, Întrebări, Profil)
- **Breakpoint:** 768px

## Database Schema

### Tables

```sql
-- Universities (seeded, ~15 major Romanian universities)
create table universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  email_domain text,
  city text
);

-- Faculties
create table faculties (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id),
  name text not null,
  short_name text not null
);

-- Invite codes (distributed via student associations, events)
create table invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  university_id uuid references universities(id),
  source text not null,              -- e.g., 'LSAC-UPB', 'orientation-event'
  max_uses integer,                  -- null = unlimited
  used_count integer default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- User profiles (email lives in auth.users, not duplicated here)
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

-- University email verification (OTP flow)
create table university_email_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  email text not null,
  code text not null,
  attempts smallint default 0,       -- incremented on each failed attempt, max 5
  expires_at timestamptz not null,
  verified boolean default false,
  created_at timestamptz default now()
);

-- Lifestyle quiz answers
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

-- Onboarding checklist templates
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id),  -- null = generic, applies to all
  title text not null,
  description text,
  category text not null,
  deadline_description text,
  sort_order smallint not null,  -- per-university scope; generic items (null university_id) use their own sequence; at query time, interleave by sort_order with generic items first at each position
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

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',  -- 'direct', 'group', 'faculty'
  name text,
  faculty_id uuid references faculties(id),
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Unique partial index: one faculty group chat per faculty
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

-- Trigger: update last_message_at on conversations when a message is inserted
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

-- Trigger: sync answers.upvotes count on vote insert/delete
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

-- Helper function: find direct conversation between two users
-- Verifies exactly 2 members to avoid matching corrupted group conversations
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

-- Invite code redemption (SECURITY DEFINER — bypasses RLS to increment used_count)
-- Called from setup-profile server action. Returns the code's id if valid, null otherwise.
-- The calling server action must then set profiles.is_verified = true and
-- profiles.invite_code_id = returned id when creating the profile row.
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

-- DM conversation: find or create (SECURITY DEFINER — inserts both members atomically)
-- Called from api/conversations/+server.ts
create or replace function get_or_create_dm(user_a uuid, user_b uuid)
returns uuid as $$
declare
  conv_id uuid;
begin
  -- Try to find existing DM
  select find_direct_conversation(user_a, user_b) into conv_id;
  if conv_id is not null then return conv_id; end if;

  -- Create new conversation + both members
  insert into conversations (type) values ('direct') returning id into conv_id;
  insert into conversation_members (conversation_id, profile_id) values
    (conv_id, user_a),
    (conv_id, user_b);

  return conv_id;
end;
$$ language plpgsql security definer;

-- Faculty group chat: find or create + add member (atomic, handles race conditions)
-- Called from setup-profile server action after profile creation
create or replace function join_faculty_group_chat(p_profile_id uuid, p_faculty_id uuid, p_faculty_short_name text)
returns uuid as $$
declare
  chat_id uuid;
begin
  -- Try to find existing faculty chat
  select id into chat_id from conversations
  where type = 'faculty' and faculty_id = p_faculty_id;

  -- Create if not found (unique index prevents duplicates on race condition)
  if chat_id is null then
    insert into conversations (type, faculty_id, name)
    values ('faculty', p_faculty_id, p_faculty_short_name || ' — Anul 1')
    on conflict (faculty_id) where type = 'faculty'
    do update set faculty_id = excluded.faculty_id  -- no-op, just to return id
    returning id into chat_id;
  end if;

  -- Add member (ignore if already exists)
  insert into conversation_members (conversation_id, profile_id)
  values (chat_id, p_profile_id)
  on conflict do nothing;

  return chat_id;
end;
$$ language plpgsql security definer;
```

### Row Level Security

All tables have RLS enabled. Key policies:

- **Universities, faculties, checklist_templates:** Public read (even for anon, needed for signup flow)
- **Profiles, quiz_answers, roommate_preferences:** Readable by all authenticated. Writable only by own user.
- **Checklist_progress:** Readable and writable only by own user.
- **Conversations:** Readable only by conversation members. Not directly insertable by users — DMs created via `get_or_create_dm` SECURITY DEFINER function, faculty chats via `join_faculty_group_chat` SECURITY DEFINER function.
- **Conversation_members:** Readable by conversation members. Not directly insertable by users — managed by the SECURITY DEFINER functions above.
- **Messages:** Readable only by conversation members. Users can only send messages in conversations they belong to.
- **Questions:** Readable by all authenticated. Insertable by verified users.
- **Answers, answer_votes:** Readable by all authenticated. Insertable by verified users. Votes manageable only by own user.
- **Invite_codes:** Readable by all (needed at signup). Not writable by users (admin only).
- **University_email_verifications:** Readable and writable only by own user.

## Project Structure

```
bazar/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte              # Root layout (auth listener)
│   │   ├── +layout.server.ts           # Root server layout (session + profile)
│   │   ├── +page.svelte                # Landing / redirect
│   │   ├── +page.server.ts
│   │   ├── (auth)/
│   │   │   ├── +layout.svelte          # Centered card layout
│   │   │   ├── login/+page.svelte
│   │   │   ├── register/+page.svelte
│   │   │   ├── verify-email/+page.svelte
│   │   │   └── setup-profile/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   ├── (app)/
│   │   │   ├── +layout.svelte          # App shell (nav bar)
│   │   │   ├── checklist/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── people/
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── +page.server.ts
│   │   │   │   └── [id]/+page.svelte
│   │   │   ├── messages/
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── +page.server.ts
│   │   │   │   └── [id]/+page.svelte
│   │   │   ├── qa/
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── +page.server.ts
│   │   │   │   ├── ask/+page.svelte
│   │   │   │   └── [id]/+page.svelte
│   │   │   ├── quiz/+page.svelte
│   │   │   └── profile/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   └── api/
│   │       └── conversations/+server.ts
│   ├── lib/
│   │   ├── supabase.ts                 # Browser client
│   │   ├── supabase-server.ts          # Server client
│   │   ├── matching.ts                 # Compatibility algorithm
│   │   ├── types.ts                    # Shared TypeScript types
│   │   └── constants.ts                # Quiz questions, sectors, categories
│   ├── components/
│   │   ├── NavBar.svelte
│   │   ├── ChecklistItem.svelte
│   │   ├── ProfileCard.svelte
│   │   ├── CompatibilityBadge.svelte
│   │   ├── QuestionCard.svelte
│   │   ├── MessageBubble.svelte
│   │   └── FilterDrawer.svelte
│   ├── hooks.server.ts
│   ├── app.d.ts
│   └── app.css
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   ├── functions/
│   │   └── verify-university-email/
│   ├── seed.sql
│   └── config.toml
├── tests/
│   ├── unit/
│   │   └── matching.test.ts
│   └── e2e/
│       └── auth.test.ts
├── static/
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
├── wrangler.toml
└── .env.local
```

## Deployment

- **Frontend:** Cloudflare Pages, connected to GitHub repo for auto-deploy on push to main
- **Backend:** Supabase Cloud (hosted PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **CI:** GitHub Actions — lint, type-check, unit tests, build on every push/PR to main
- **Environment variables:** `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` set in Cloudflare Pages dashboard

## Seed Data

### Universities (~15 at launch)

Major Romanian universities across multiple cities: UPB, ASE, UB (Bucharest), UBB (Cluj), UAIC (Iași), UVT (Timișoara), UTCN (Cluj), TUIASI (Iași), UMF (various), USAMV (various), plus others based on research.

Each with their faculties and email domains.

### Checklist Templates

- ~10 generic items that apply to all universities (adeverință medicală, STB/transport, etc.)
- University-specific items where we have data (UPB initially, expand as we learn)

## Post-MVP Considerations

- Push notifications (web push via service worker)
- PWA manifest (installable from browser)
- Admin panel for managing checklist content and invite codes
- Email notifications for new messages
- "I have an apartment" flow with OLX link embedding
- Expand university seed data based on traction
- Student association dashboard for managing their invite codes
