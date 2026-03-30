# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add role-based admin functionality so class leads, ASMI reps, and admins can manage announcements, checklist items, and Q&A moderation.

**Architecture:** Add a `role` column to profiles, create an `announcements` table, add admin routes under `(app)/admin/` gated by role checks. Use existing Supabase RLS with role-aware policies. The admin UI lives in the same app — no separate service.

**Tech Stack:** SvelteKit, Supabase (Postgres + RLS), Tailwind CSS

---

### Task 1: Database Migration — roles, announcements table, RLS policies

**Files:**
- Create: `supabase/migrations/004_admin_roles_announcements.sql`

- [ ] **Step 1: Apply migration via Supabase MCP**

```sql
-- Add role to profiles
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'student';

-- Create announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read announcements
CREATE POLICY "Announcements readable by authenticated"
  ON announcements FOR SELECT TO authenticated USING (true);

-- Only elevated roles can insert
CREATE POLICY "Elevated roles can create announcements"
  ON announcements FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('class_lead', 'asmi', 'admin')
    )
  );

-- Only author or admin can update
CREATE POLICY "Author or admin can update announcements"
  ON announcements FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only author or admin can delete
CREATE POLICY "Author or admin can delete announcements"
  ON announcements FOR DELETE TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow elevated roles to manage checklist_templates
CREATE POLICY "Elevated roles can insert checklist templates"
  ON checklist_templates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('class_lead', 'asmi', 'admin')
    )
  );

CREATE POLICY "Elevated roles can update checklist templates"
  ON checklist_templates FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('class_lead', 'asmi', 'admin')
    )
  );

CREATE POLICY "Elevated roles can delete checklist templates"
  ON checklist_templates FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('class_lead', 'asmi', 'admin')
    )
  );

-- Allow elevated roles to update questions (pin/unpin)
CREATE POLICY "Elevated roles can update questions"
  ON questions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('class_lead', 'asmi', 'admin')
    )
  );

-- Allow elevated roles to delete questions
CREATE POLICY "Elevated roles can delete questions"
  ON questions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('class_lead', 'asmi', 'admin')
    )
  );
```

- [ ] **Step 2: Set your own profile to admin role**

```sql
UPDATE profiles SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
);
```

---

### Task 2: Admin layout and role guard

**Files:**
- Create: `src/routes/(app)/admin/+layout.server.ts`
- Create: `src/routes/(app)/admin/+layout.svelte`

- [ ] **Step 1: Create admin layout server load with role check**

`src/routes/(app)/admin/+layout.server.ts`:
```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const ELEVATED_ROLES = ['class_lead', 'asmi', 'admin'];

export const load: LayoutServerLoad = async ({ parent }) => {
  const { profile } = await parent();

  if (!profile || !ELEVATED_ROLES.includes(profile.role)) {
    redirect(303, '/checklist');
  }

  return { role: profile.role };
};
```

- [ ] **Step 2: Create admin layout with sub-navigation**

`src/routes/(app)/admin/+layout.svelte`:
```svelte
<script lang="ts">
  import { page } from '$app/state';

  let { data, children } = $props();

  const tabs = [
    { href: '/admin', label: 'Anunturi', icon: '📢' },
    { href: '/admin/checklist', label: 'Checklist', icon: '📋' },
    { href: '/admin/questions', label: 'Intrebari', icon: '❓' },
  ];

  // Only admins see the roles tab
  const allTabs = $derived(
    data.role === 'admin'
      ? [...tabs, { href: '/admin/roles', label: 'Roluri', icon: '👥' }]
      : tabs
  );

  function isActive(href: string) {
    if (href === '/admin') return page.url.pathname === '/admin';
    return page.url.pathname.startsWith(href);
  }
</script>

<div class="px-5 py-6 max-w-3xl mx-auto">
  <div class="flex items-center justify-between mb-1">
    <h1 class="text-2xl font-heading font-bold text-bazar-dark">Admin</h1>
    <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-bazar-purple/10 text-bazar-purple">
      {data.role}
    </span>
  </div>
  <p class="text-sm text-bazar-gray-500 mb-5">Gestioneaza continutul aplicatiei.</p>

  <div class="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
    {#each allTabs as tab}
      <a
        href={tab.href}
        class="shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors
          {isActive(tab.href)
            ? 'bg-bazar-yellow text-bazar-dark'
            : 'bg-white text-bazar-gray-500 hover:text-bazar-dark'}"
      >
        <span>{tab.icon}</span>
        {tab.label}
      </a>
    {/each}
  </div>

  {@render children()}
</div>
```

---

### Task 3: Announcements admin page (CRUD)

**Files:**
- Create: `src/routes/(app)/admin/+page.server.ts`
- Create: `src/routes/(app)/admin/+page.svelte`

- [ ] **Step 1: Server load + form actions for announcements**

`src/routes/(app)/admin/+page.server.ts`:
```typescript
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: announcements } = await locals.supabase
    .from('announcements')
    .select('*, author:profiles(full_name)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return { announcements: announcements ?? [] };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const form = await request.formData();
    const title = form.get('title') as string;
    const body = form.get('body') as string;
    const category = form.get('category') as string;

    if (!title?.trim() || !body?.trim()) {
      return fail(400, { error: 'Titlul si continutul sunt obligatorii.' });
    }

    const { error } = await locals.supabase.from('announcements').insert({
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      category: category?.trim() || null,
    });

    if (error) return fail(500, { error: 'Eroare la salvare.' });
    return { success: true };
  },

  update: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const title = form.get('title') as string;
    const body = form.get('body') as string;
    const category = form.get('category') as string;

    if (!id || !title?.trim() || !body?.trim()) {
      return fail(400, { error: 'Campuri obligatorii lipsa.' });
    }

    const { error } = await locals.supabase
      .from('announcements')
      .update({
        title: title.trim(),
        body: body.trim(),
        category: category?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return fail(500, { error: 'Eroare la actualizare.' });
    return { success: true };
  },

  togglePin: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const pinned = form.get('is_pinned') === 'true';

    const { error } = await locals.supabase
      .from('announcements')
      .update({ is_pinned: !pinned })
      .eq('id', id);

    if (error) return fail(500, { error: 'Eroare.' });
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    const { error } = await locals.supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) return fail(500, { error: 'Eroare la stergere.' });
  },
};
```

- [ ] **Step 2: Create announcements admin page UI**

`src/routes/(app)/admin/+page.svelte` — form to create announcements, list of existing ones with edit/pin/delete actions. Each announcement card shows title, body preview, category, pin status, and action buttons.

- [ ] **Step 3: Commit**

---

### Task 4: Checklist admin page (CRUD templates)

**Files:**
- Create: `src/routes/(app)/admin/checklist/+page.server.ts`
- Create: `src/routes/(app)/admin/checklist/+page.svelte`

- [ ] **Step 1: Server load + form actions for checklist templates**

`src/routes/(app)/admin/checklist/+page.server.ts`:
```typescript
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile } = await parent();

  // Get university_id from profile's faculty
  let universityId = null;
  if (profile?.faculty_id) {
    const { data: faculty } = await locals.supabase
      .from('faculties')
      .select('university_id')
      .eq('id', profile.faculty_id)
      .single();
    universityId = faculty?.university_id;
  }

  const { data: templates } = await locals.supabase
    .from('checklist_templates')
    .select('*')
    .order('sort_order');

  return { templates: templates ?? [], universityId };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();
    const title = form.get('title') as string;
    const description = form.get('description') as string;
    const category = form.get('category') as string;
    const deadline_description = form.get('deadline_description') as string;
    const url = form.get('url') as string;
    const university_id = form.get('university_id') as string;
    const sort_order = parseInt(form.get('sort_order') as string) || 0;

    if (!title?.trim() || !category?.trim()) {
      return fail(400, { error: 'Titlul si categoria sunt obligatorii.' });
    }

    const { error } = await locals.supabase.from('checklist_templates').insert({
      title: title.trim(),
      description: description?.trim() || null,
      category: category.trim(),
      deadline_description: deadline_description?.trim() || null,
      url: url?.trim() || null,
      university_id: university_id || null,
      sort_order,
    });

    if (error) return fail(500, { error: 'Eroare la salvare.' });
    return { success: true };
  },

  update: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const title = form.get('title') as string;
    const description = form.get('description') as string;
    const category = form.get('category') as string;
    const deadline_description = form.get('deadline_description') as string;
    const url = form.get('url') as string;
    const sort_order = parseInt(form.get('sort_order') as string) || 0;

    if (!id || !title?.trim() || !category?.trim()) {
      return fail(400, { error: 'Campuri obligatorii lipsa.' });
    }

    const { error } = await locals.supabase
      .from('checklist_templates')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        category: category.trim(),
        deadline_description: deadline_description?.trim() || null,
        url: url?.trim() || null,
        sort_order,
      })
      .eq('id', id);

    if (error) return fail(500, { error: 'Eroare la actualizare.' });
    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    const { error } = await locals.supabase
      .from('checklist_templates')
      .delete()
      .eq('id', id);

    if (error) return fail(500, { error: 'Eroare la stergere.' });
  },
};
```

- [ ] **Step 2: Create checklist admin page UI**

`src/routes/(app)/admin/checklist/+page.svelte` — form to create templates (title, description, category dropdown, deadline, URL, sort order), list of existing templates with edit/delete. Category dropdown uses the existing categories: documents, housing, registration, campus, transport, health.

- [ ] **Step 3: Commit**

---

### Task 5: Questions moderation admin page

**Files:**
- Create: `src/routes/(app)/admin/questions/+page.server.ts`
- Create: `src/routes/(app)/admin/questions/+page.svelte`

- [ ] **Step 1: Server load + form actions for question moderation**

`src/routes/(app)/admin/questions/+page.server.ts`:
```typescript
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: questions } = await locals.supabase
    .from('questions')
    .select('*, author:profiles(full_name), answers(count)')
    .order('created_at', { ascending: false });

  return { questions: questions ?? [] };
};

export const actions: Actions = {
  togglePin: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const pinned = form.get('is_pinned') === 'true';

    const { error } = await locals.supabase
      .from('questions')
      .update({ is_pinned: !pinned })
      .eq('id', id);

    if (error) return fail(500, { error: 'Eroare.' });
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    const { error } = await locals.supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) return fail(500, { error: 'Eroare la stergere.' });
  },
};
```

- [ ] **Step 2: Create questions admin page UI**

`src/routes/(app)/admin/questions/+page.svelte` — list of all questions with author, answer count, pin status, created date. Action buttons: pin/unpin, delete, link to view full question. Pinned questions highlighted at top.

- [ ] **Step 3: Commit**

---

### Task 6: Roles management page (admin only)

**Files:**
- Create: `src/routes/(app)/admin/roles/+page.server.ts`
- Create: `src/routes/(app)/admin/roles/+page.svelte`

- [ ] **Step 1: Server load + form actions for role management**

`src/routes/(app)/admin/roles/+page.server.ts`:
```typescript
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role } = await parent();
  if (role !== 'admin') return { users: [] };

  const { data: users } = await locals.supabase
    .from('profiles')
    .select('id, full_name, role, is_verified, faculty:faculties(short_name)')
    .order('full_name');

  return { users: users ?? [] };
};

export const actions: Actions = {
  setRole: async ({ request, locals, parent }) => {
    const { role: currentRole } = await parent();
    if (currentRole !== 'admin') return fail(403);

    const form = await request.formData();
    const userId = form.get('user_id') as string;
    const newRole = form.get('role') as string;

    if (!['student', 'class_lead', 'asmi', 'admin'].includes(newRole)) {
      return fail(400, { error: 'Rol invalid.' });
    }

    const { error } = await locals.supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) return fail(500, { error: 'Eroare la actualizare.' });
    return { success: true };
  },
};
```

- [ ] **Step 2: Create roles admin page UI**

`src/routes/(app)/admin/roles/+page.svelte` — searchable list of users showing name, faculty, current role, verification status. Each user row has a role dropdown (student/class_lead/asmi/admin) with a save button. Search filters by name.

- [ ] **Step 3: Commit**

---

### Task 7: Wire announcements into the community page

**Files:**
- Modify: `src/routes/(app)/qa/+page.server.ts`
- Modify: `src/routes/(app)/qa/+page.svelte`

- [ ] **Step 1: Load real announcements in Q&A server**

Update `src/routes/(app)/qa/+page.server.ts` to also fetch announcements:
```typescript
const [{ data: questions }, { data: announcements }] = await Promise.all([
  locals.supabase
    .from('questions')
    .select('*, author:profiles(full_name, year, faculty_id), answers(count)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false }),
  locals.supabase
    .from('announcements')
    .select('*, author:profiles(full_name, role)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false }),
]);

return {
  questions: questions ?? [],
  announcements: announcements ?? [],
  userFacultyId: profile?.faculty_id,
};
```

- [ ] **Step 2: Replace hardcoded announcements in Q&A page with real data**

Update the Anunturi tab in `+page.svelte` to loop over `data.announcements` instead of showing hardcoded cards. Show empty state when no announcements exist.

- [ ] **Step 3: Commit**

---

### Task 8: Add admin link to NavBar for elevated roles

**Files:**
- Modify: `src/lib/components/NavBar.svelte`
- Modify: `src/routes/(app)/+layout.svelte` (pass role to NavBar)

- [ ] **Step 1: Pass role to NavBar**

The profile object already gets passed to NavBar. The role column will be available on `profile.role`. Add the admin link conditionally:

```svelte
{#if profile?.role && ['class_lead', 'asmi', 'admin'].includes(profile.role)}
  <!-- Admin link after regular nav links -->
{/if}
```

- [ ] **Step 2: Commit**

---

### Task 9: Update TypeScript types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Regenerate or manually add types**

Add the `role` field to Profile type and create Announcement type. Run `supabase gen types typescript` or manually extend.

- [ ] **Step 2: Commit**
