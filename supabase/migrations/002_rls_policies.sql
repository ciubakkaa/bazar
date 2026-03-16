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
