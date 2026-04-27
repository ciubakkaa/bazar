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
