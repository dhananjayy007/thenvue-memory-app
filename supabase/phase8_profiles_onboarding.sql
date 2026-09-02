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

-- Safe migration for existing users:
-- If an existing user has memories, initialize has_completed_onboarding = true.
-- If brand-new user with 0 memories, initialize has_completed_onboarding = false.
insert into public.profiles (id, has_completed_onboarding, display_name)
select 
  u.id,
  case 
    when exists (select 1 from public.memories m where m.user_id = u.id and m.deleted_at is null) then true
    else false
  end as has_completed_onboarding,
  coalesce(u.raw_user_meta_data->>'display_name', '') as display_name
from auth.users u
on conflict (id) do update set
  has_completed_onboarding = case 
    when public.profiles.has_completed_onboarding = true then true
    when exists (select 1 from public.memories m where m.user_id = excluded.id and m.deleted_at is null) then true
    else public.profiles.has_completed_onboarding
  end;

-- RPC: get_or_create_profile
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

  -- Check if user has existing memories
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

-- RPC: complete_onboarding (idempotent)
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
