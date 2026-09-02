-- Phase 9: Shared Memories, Perspectives, Participants, and Notifications

-- 1. Memory Participants Table
create table if not exists public.memory_participants (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  invited_by uuid not null references auth.users (id),
  status text not null check (status in ('pending', 'accepted', 'declined', 'removed', 'left')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (memory_id, user_id)
);

-- 2. Memory Perspectives Table
create table if not exists public.memory_perspectives (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  place text not null default '',
  people text[] not null default '{}',
  topics text[] not null default '{}',
  mood text not null default '',
  summary text not null default '',
  memory_type text not null default '',
  saved_to_personal_memory boolean not null default false,
  personal_memory_id uuid references public.memories (id) on delete set null,
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Extend Media Table to support perspectives
alter table public.media add column if not exists perspective_id uuid references public.memory_perspectives (id) on delete cascade;

-- 4. Extend Memories Table for shared memory origin context
alter table public.memories add column if not exists source_memory_id uuid references public.memories (id) on delete set null;
alter table public.memories add column if not exists shared_context text default null;

-- 5. Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  memory_id uuid not null references public.memories (id) on delete cascade,
  perspective_id uuid references public.memory_perspectives (id) on delete cascade,
  type text not null check (type in ('invitation', 'perspective_added')),
  title text not null,
  body text not null,
  status text not null check (status in ('unread', 'read')) default 'unread',
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists memory_participants_memory_user_idx on public.memory_participants (memory_id, user_id);
create index if not exists memory_participants_user_status_idx on public.memory_participants (user_id, status);
create index if not exists memory_perspectives_memory_idx on public.memory_perspectives (memory_id, created_at desc);
create index if not exists memory_perspectives_user_idx on public.memory_perspectives (user_id);
create index if not exists media_perspective_idx on public.media (perspective_id);
create index if not exists notifications_user_status_idx on public.notifications (user_id, status, created_at desc);

-- ==========================================================================
-- Security Definer Helper Functions (Prevents Infinite RLS Recursion)
-- ==========================================================================

create or replace function public.is_memory_participant(p_memory_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.memory_participants
    where memory_id = p_memory_id
      and user_id = p_user_id
      and status in ('accepted', 'pending')
  );
$$;

create or replace function public.is_memory_owner(p_memory_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.memories
    where id = p_memory_id
      and user_id = p_user_id
  );
$$;

grant execute on function public.is_memory_participant(uuid, uuid) to authenticated;
grant execute on function public.is_memory_owner(uuid, uuid) to authenticated;

-- ==========================================================================
-- RLS Policies
-- ==========================================================================

alter table public.memory_participants enable row level security;
alter table public.memory_perspectives enable row level security;
alter table public.notifications enable row level security;
alter table public.memories enable row level security;
alter table public.media enable row level security;

-- Drop all previous policies to eliminate recursion
drop policy if exists "select memory participants" on public.memory_participants;
drop policy if exists "insert memory participants" on public.memory_participants;
drop policy if exists "update memory participants" on public.memory_participants;
drop policy if exists "delete memory participants" on public.memory_participants;

drop policy if exists "select memory perspectives" on public.memory_perspectives;
drop policy if exists "insert memory perspectives" on public.memory_perspectives;
drop policy if exists "update own memory perspectives" on public.memory_perspectives;
drop policy if exists "delete memory perspectives" on public.memory_perspectives;

drop policy if exists "select own notifications" on public.notifications;
drop policy if exists "update own notifications" on public.notifications;
drop policy if exists "insert notifications" on public.notifications;

drop policy if exists "select own memories" on public.memories;
drop policy if exists "select own or shared memories" on public.memories;

drop policy if exists "select own media" on public.media;
drop policy if exists "select own or shared media" on public.media;
drop policy if exists "insert own media for own memory" on public.media;
drop policy if exists "insert own or perspective media" on public.media;

-- 1. Memory Participants Policies
create policy "select memory participants" on public.memory_participants
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or invited_by = (select auth.uid())
    or public.is_memory_owner(memory_id, (select auth.uid()))
  );

create policy "insert memory participants" on public.memory_participants
  for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and public.is_memory_owner(memory_id, (select auth.uid()))
  );

create policy "update memory participants" on public.memory_participants
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or invited_by = (select auth.uid())
    or public.is_memory_owner(memory_id, (select auth.uid()))
  );

create policy "delete memory participants" on public.memory_participants
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or invited_by = (select auth.uid())
    or public.is_memory_owner(memory_id, (select auth.uid()))
  );

-- 2. Memory Perspectives Policies
create policy "select memory perspectives" on public.memory_perspectives
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_memory_owner(memory_id, (select auth.uid()))
    or public.is_memory_participant(memory_id, (select auth.uid()))
  );

create policy "insert memory perspectives" on public.memory_perspectives
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      public.is_memory_owner(memory_id, (select auth.uid()))
      or public.is_memory_participant(memory_id, (select auth.uid()))
    )
  );

create policy "update own memory perspectives" on public.memory_perspectives
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "delete memory perspectives" on public.memory_perspectives
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_memory_owner(memory_id, (select auth.uid()))
  );

-- 3. Notifications Policies
create policy "select own notifications" on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "update own notifications" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "insert notifications" on public.notifications
  for insert to authenticated
  with check (actor_id = (select auth.uid()));

-- 4. Memories SELECT Policy
create policy "select own or shared memories" on public.memories
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_memory_participant(id, (select auth.uid()))
  );

-- 5. Media Policies
create policy "select own or shared media" on public.media
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or public.is_memory_owner(memory_id, (select auth.uid()))
    or public.is_memory_participant(memory_id, (select auth.uid()))
  );

create policy "insert own or perspective media" on public.media
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
  );

-- 6. User search function for invite people
create or replace function public.search_users_to_invite(search_query text)
returns table (
  id uuid,
  display_name text,
  email text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    p.id,
    p.display_name,
    coalesce(u.email, '') as email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id <> v_uid
    and (
      p.display_name ilike '%' || search_query || '%'
      or u.email ilike '%' || search_query || '%'
      or split_part(u.email, '@', 1) ilike '%' || search_query || '%'
    )
  limit 15;
end;
$$;

grant execute on function public.search_users_to_invite(text) to authenticated;
