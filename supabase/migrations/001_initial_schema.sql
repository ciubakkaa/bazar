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
