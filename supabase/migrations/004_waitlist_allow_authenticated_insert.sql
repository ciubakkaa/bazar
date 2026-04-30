drop policy if exists "anon can insert waitlist" on public.waitlist_signups;

create policy "public can insert waitlist"
  on public.waitlist_signups
  for insert
  to anon, authenticated
  with check (true);
