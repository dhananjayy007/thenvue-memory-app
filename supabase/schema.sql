-- Run this once in the Supabase SQL Editor. It is idempotent and migrates the
-- earlier `image_url` / `image_urls` storage into first-class media records.

create table if not exists public.memories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) default auth.uid(),
  title         text not null default 'A new memory',
  body          text not null,
  occurred_at   timestamptz not null default now(),
  occurred_on   date not null default current_date,
  occurred_time time not null default localtime,
  place         text not null default '',
  people        text[] not null default '{}',
  topic         text not null default '',
  mood          text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Keep a local calendar value for a capture. An event saved at 00:05 on an
-- Android phone remains on that local day even if it is viewed in another zone.
alter table public.memories add column if not exists occurred_on date;
alter table public.memories add column if not exists occurred_time time;
update public.memories
  set occurred_on = (occurred_at at time zone 'UTC')::date,
      occurred_time = (occurred_at at time zone 'UTC')::time
  where occurred_on is null or occurred_time is null;
alter table public.memories alter column occurred_on set default current_date;
alter table public.memories alter column occurred_on set not null;
alter table public.memories alter column occurred_time set default localtime;
alter table public.memories alter column occurred_time set not null;

-- Normalize the first Phase 4 implementation before migrating it to `media`.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'memories' and column_name = 'image_url'
  ) then
    alter table public.memories add column if not exists image_urls text[] not null default '{}';
    update public.memories
      set image_urls = array[image_url]
      where image_url is not null and image_urls = '{}';
    alter table public.memories drop column image_url;
  end if;
end;
$$;

create table if not exists public.media (
  id           uuid primary key default gen_random_uuid(),
  memory_id    uuid not null references public.memories (id) on delete cascade,
  user_id      uuid not null references auth.users (id) default auth.uid(),
  storage_path text not null,
  media_type   text not null check (media_type in ('image', 'audio')),
  file_name    text not null,
  file_size    bigint not null check (file_size >= 0),
  created_at   timestamptz not null default now(),
  unique (memory_id, storage_path)
);
alter table public.media drop constraint if exists media_media_type_check;
alter table public.media add constraint media_media_type_check check (media_type in ('image', 'audio'));

-- Convert old paths and old public URLs into storage paths. Older records have
-- no reliable original file size, so their size is recorded as 0 (unknown).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'memories' and column_name = 'image_urls'
  ) then
    execute $migration$
      with legacy_media as (
        select
          memories.id as memory_id,
          memories.user_id,
          split_part(
            case
              when image_reference like 'http%' then regexp_replace(image_reference, '^.*/memory-photos/', '')
              else image_reference
            end,
            '?',
            1
          ) as storage_path
        from public.memories
        cross join lateral unnest(coalesce(memories.image_urls, '{}'::text[])) as image_reference
      )
      insert into public.media (memory_id, user_id, storage_path, media_type, file_name, file_size)
      select
        memory_id,
        user_id,
        storage_path,
        'image',
        regexp_replace(storage_path, '^.*/', ''),
        0
      from legacy_media
      where storage_path <> ''
      on conflict (memory_id, storage_path) do nothing
    $migration$;
    alter table public.memories drop column image_urls;
  end if;
end;
$$;

alter table public.memories drop constraint if exists memories_body_not_blank;
alter table public.memories add constraint memories_body_not_blank check (length(btrim(body)) > 0);

-- Phase 5A: structured AI understanding of each memory.
alter table public.memories add column if not exists summary text not null default '';
alter table public.memories add column if not exists memory_type text not null default '';
alter table public.memories add column if not exists topics text[] not null default '{}';
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'memories' and column_name = 'topic'
  ) then
    execute 'update public.memories set topics = array[topic] where topics = ''{}'' and coalesce(topic, '''') <> ''''';
    execute 'alter table public.memories drop column topic';
  end if;
end;
$$;

-- Phase 5B: pgvector embeddings and semantic search.
create extension if not exists vector;
alter table public.memories add column if not exists embedding vector(768);

create index if not exists memories_embedding_hnsw_idx
  on public.memories
  using hnsw (embedding vector_cosine_ops)
  where deleted_at is null;

create index if not exists memories_user_active_occurred_at_idx
  on public.memories (user_id, occurred_at desc)
  where deleted_at is null;
create index if not exists media_memory_user_created_at_idx
  on public.media (memory_id, user_id, created_at);

-- Semantic search function with strict authenticated user isolation.
create or replace function public.match_memories(
  query_embedding vector(768),
  match_threshold float default 0.0,
  match_count int default 10
)
returns table (
  id uuid,
  title text,
  body text,
  occurred_on date,
  occurred_time time,
  place text,
  people text[],
  topics text[],
  summary text,
  memory_type text,
  mood text,
  similarity float
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  select
    m.id,
    m.title,
    m.body,
    m.occurred_on,
    m.occurred_time,
    m.place,
    m.people,
    m.topics,
    m.summary,
    m.memory_type,
    m.mood,
    (1 - (m.embedding <=> query_embedding))::float as similarity
  from public.memories m
  where m.deleted_at is null
    and m.embedding is not null
    and (1 - (m.embedding <=> query_embedding)) >= match_threshold
    and m.user_id = (select auth.uid())
  order by m.embedding <=> query_embedding asc
  limit match_count;
end;
$$;

grant execute on function public.match_memories(vector(768), float, int) to authenticated;

alter table public.memories enable row level security;
alter table public.media enable row level security;

drop policy if exists "select own memories" on public.memories;
create policy "select own memories" on public.memories
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "insert own memories" on public.memories;
create policy "insert own memories" on public.memories
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "update own memories" on public.memories;
create policy "update own memories" on public.memories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "delete own memories" on public.memories;
create policy "delete own memories" on public.memories
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "select own media" on public.media;
create policy "select own media" on public.media
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "insert own media for own memory" on public.media;
create policy "insert own media for own memory" on public.media
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.memories
      where memories.id = memory_id and memories.user_id = (select auth.uid())
    )
  );

drop policy if exists "delete own media" on public.media;
create policy "delete own media" on public.media
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.media to authenticated;

-- Keep updated_at current on every memory update.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists memories_set_updated_at on public.memories;
create trigger memories_set_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

-- Private image storage. Storage paths are saved in `media`; short-lived signed
-- URLs are generated only when an owner reads a memory.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-photos',
  'memory-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view memory photos" on storage.objects;
drop policy if exists "Users can view own memory photos" on storage.objects;
create policy "Users can view own memory photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can upload own memory photos" on storage.objects;
create policy "Users can upload own memory photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete own memory photos" on storage.objects;
create policy "Users can delete own memory photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Private audio storage for voice memories.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-audio',
  'memory-audio',
  false,
  20971520,
  array['audio/webm', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mpeg']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view own memory audio" on storage.objects;
create policy "Users can view own memory audio" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'memory-audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can upload own memory audio" on storage.objects;
create policy "Users can upload own memory audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'memory-audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Phase 7: Add photo to existing memory with same-day calendar restriction
create or replace function public.verify_memory_photo_eligibility(
  p_memory_id uuid,
  p_client_timezone text default 'UTC'
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_memory public.memories%rowtype;
  v_user_id uuid;
  v_today_in_tz date;
  v_effective_tz text;
begin
  -- 1. Verify user authentication
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 2. Verify memory exists and belongs to authenticated user
  select * into v_memory
  from public.memories
  where id = p_memory_id
    and user_id = v_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Memory not found or unauthorized';
  end if;

  -- 3. Determine today's calendar date in the client's timezone safely
  v_effective_tz := coalesce(nullif(trim(p_client_timezone), ''), 'UTC');
  begin
    v_today_in_tz := (now() at time zone v_effective_tz)::date;
  exception when others then
    -- Fallback to UTC if timezone string is invalid
    v_today_in_tz := (now() at time zone 'UTC')::date;
  end;

  -- 4. Server-side Same-Day Enforcement
  if v_memory.occurred_on <> v_today_in_tz then
    raise exception 'Photos can only be added to memories from today.';
  end if;

  return true;
end;
$$;

grant execute on function public.verify_memory_photo_eligibility(uuid, text) to authenticated;

create or replace function public.attach_photo_to_memory(
  p_memory_id uuid,
  p_storage_path text,
  p_file_name text,
  p_file_size bigint,
  p_client_timezone text default 'UTC'
)
returns public.media
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_memory public.memories%rowtype;
  v_user_id uuid;
  v_today_in_tz date;
  v_media public.media;
  v_effective_tz text;
begin
  -- 1. Verify user authentication
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 2. Verify memory exists and belongs to authenticated user (RLS + explicit check)
  select * into v_memory
  from public.memories
  where id = p_memory_id
    and user_id = v_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Memory not found or unauthorized';
  end if;

  -- 3. Determine today's calendar date in the client's timezone safely
  v_effective_tz := coalesce(nullif(trim(p_client_timezone), ''), 'UTC');
  begin
    v_today_in_tz := (now() at time zone v_effective_tz)::date;
  exception when others then
    -- Fallback to UTC if timezone string is invalid
    v_today_in_tz := (now() at time zone 'UTC')::date;
  end;

  -- 4. Server-side Same-Day Enforcement
  if v_memory.occurred_on <> v_today_in_tz then
    raise exception 'Photos can only be added to memories from today.';
  end if;

  -- 5. Insert new media record attached to the existing memory
  insert into public.media (
    memory_id,
    user_id,
    storage_path,
    media_type,
    file_name,
    file_size
  )
  values (
    p_memory_id,
    v_user_id,
    p_storage_path,
    'image',
    p_file_name,
    p_file_size
  )
  returning * into v_media;

  return v_media;
end;
$$;

grant execute on function public.attach_photo_to_memory(uuid, text, text, bigint, text) to authenticated;

-- Phase 8: Profiles table with has_completed_onboarding as authoritative source of truth
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  has_completed_onboarding boolean not null default false,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "select own profile" on public.profiles;
create policy "select own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

grant select, insert, update on public.profiles to authenticated;

create or replace function public.get_or_create_profile()
returns public.profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_profile public.profiles%rowtype;
  v_has_memories boolean;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id;

  if found then
    return v_profile;
  end if;

  select exists (
    select 1 from public.memories
    where user_id = v_user_id and deleted_at is null
  ) into v_has_memories;

  insert into public.profiles (id, has_completed_onboarding, display_name)
  values (v_user_id, coalesce(v_has_memories, false), '')
  on conflict (id) do update set
    updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.get_or_create_profile() to authenticated;

create or replace function public.complete_onboarding()
returns public.profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_profile public.profiles%rowtype;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, has_completed_onboarding, updated_at)
  values (v_user_id, true, now())
  on conflict (id) do update set
    has_completed_onboarding = true,
    updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.complete_onboarding() to authenticated;
