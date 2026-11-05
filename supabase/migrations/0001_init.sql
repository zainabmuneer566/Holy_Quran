-- Noor: personal data schema. Run once in the Supabase SQL Editor (or via the Supabase CLI).
-- Quran content is NOT stored here; it comes from the Quran Foundation API.


-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 60))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- preferences ----------
create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  translation_ids integer[] not null default '{}' check (cardinality(translation_ids) <= 2),
  reciter_id integer,
  arabic_size integer check (arabic_size between 20 and 56),
  theme text check (theme in ('system', 'light', 'dark', 'sepia')),
  show_streak boolean not null default true,
  keep_history boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------- bookmarks & notes ----------
create table public.bookmark_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  collection_id uuid,
  surah integer not null check (surah between 1 and 114),
  ayah integer not null check (ayah between 1 and 286),
  created_at timestamptz not null default now(),
  unique (user_id, surah, ayah),
  -- a bookmark can only point at a collection owned by the same user
  foreign key (collection_id, user_id) references public.bookmark_collections (id, user_id) on delete set null (collection_id)
);

create table public.personal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah integer not null check (surah between 1 and 114),
  ayah integer not null check (ayah between 1 and 286),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, surah, ayah)
);

-- ---------- reading ----------
create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah integer not null check (surah between 1 and 114),
  opened_at timestamptz not null default now()
);

-- One row per ayah the user explicitly marked as read on a given (UTC) day.
create table public.reading_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  surah integer not null check (surah between 1 and 114),
  ayah integer not null check (ayah between 1 and 286),
  read_on date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  primary key (user_id, surah, ayah, read_on)
);

create table public.reading_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_ayahs integer not null default 5 check (daily_ayahs between 1 and 1000),
  weekly_ayahs integer check (weekly_ayahs between 1 and 7000),
  daily_memorization integer not null default 0 check (daily_memorization between 0 and 100),
  updated_at timestamptz not null default now()
);

-- ---------- memorization ----------
create table public.memorization_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah integer not null check (surah between 1 and 114),
  ayah integer not null check (ayah between 1 and 286),
  status text not null check (status in ('learning', 'memorized', 'revision')),
  next_review_on date,
  updated_at timestamptz not null default now(),
  unique (user_id, surah, ayah)
);

-- Reminder PREFERENCES only. Nothing in this app sends reminders yet.
create table public.reminder_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_reading_enabled boolean not null default false,
  daily_ayah_enabled boolean not null default false,
  reminder_time time,
  timezone text check (char_length(timezone) <= 64),
  updated_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index bookmarks_user_idx on public.bookmarks (user_id, surah, ayah);
create index bookmarks_collection_idx on public.bookmarks (collection_id);
create index notes_user_idx on public.personal_notes (user_id, surah);
create index sessions_user_idx on public.reading_sessions (user_id, opened_at desc);
create index progress_day_idx on public.reading_progress (user_id, read_on);
create index memo_user_idx on public.memorization_progress (user_id, surah, ayah);
create index memo_review_idx on public.memorization_progress (user_id, next_review_on);

-- ---------- updated_at triggers ----------
create trigger t_profiles_u before update on public.profiles for each row execute function public.set_updated_at();
create trigger t_prefs_u before update on public.user_preferences for each row execute function public.set_updated_at();
create trigger t_notes_u before update on public.personal_notes for each row execute function public.set_updated_at();
create trigger t_goals_u before update on public.reading_goals for each row execute function public.set_updated_at();
create trigger t_memo_u before update on public.memorization_progress for each row execute function public.set_updated_at();
create trigger t_remind_u before update on public.reminder_preferences for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.bookmark_collections enable row level security;
alter table public.bookmarks enable row level security;
alter table public.personal_notes enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_goals enable row level security;
alter table public.memorization_progress enable row level security;
alter table public.reminder_preferences enable row level security;

-- profiles are keyed by id
create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete on public.profiles for delete to authenticated using ((select auth.uid()) = id);

-- every other table is keyed by user_id
do $$
declare t text;
begin
  foreach t in array array[
    'user_preferences', 'bookmark_collections', 'bookmarks', 'personal_notes', 'reading_sessions',
    'reading_progress', 'reading_goals', 'memorization_progress', 'reminder_preferences'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t || '_delete', t);
  end loop;
end $$;

-- ---------- privileges (explicit, signed-in users only; anonymous visitors get nothing) ----------
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles, public.user_preferences, public.bookmark_collections, public.bookmarks,
  public.personal_notes, public.reading_sessions, public.reading_progress, public.reading_goals,
  public.memorization_progress, public.reminder_preferences
to authenticated;

-- ---------- progress summaries (security invoker: RLS still applies) ----------
create or replace function public.my_progress_by_surah()
returns table (surah integer, ayahs integer)
language sql stable security invoker set search_path = public as $$
  select surah, count(distinct ayah)::integer
  from public.reading_progress
  where user_id = (select auth.uid())
  group by surah
$$;

create or replace function public.my_daily_counts(since date)
returns table (day date, ayahs integer)
language sql stable security invoker set search_path = public as $$
  select read_on, count(*)::integer
  from public.reading_progress
  where user_id = (select auth.uid()) and read_on >= since
  group by read_on
  order by read_on desc
$$;

revoke all on function public.my_progress_by_surah() from public, anon;
revoke all on function public.my_daily_counts(date) from public, anon;
grant execute on function public.my_progress_by_surah() to authenticated;
grant execute on function public.my_daily_counts(date) to authenticated;
