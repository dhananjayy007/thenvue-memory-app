-- =========================================================================
-- Fix Shared Memory Photos & Media Access for Participants
-- Run this in your Supabase Dashboard -> SQL Editor -> New query -> Run
-- =========================================================================

-- 1. Helper functions (Security Definer to check ownership and participation)
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

-- 2. Allow participants to query media records of shared memories
alter table public.media enable row level security;
drop policy if exists "select own media" on public.media;
drop policy if exists "select own or shared media" on public.media;
create policy "select own or shared media" on public.media
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_memory_owner(memory_id, (select auth.uid()))
    or public.is_memory_participant(memory_id, (select auth.uid()))
  );

-- 3. Allow authenticated participants to view and sign photos/audio in storage
drop policy if exists "Users can view own memory photos" on storage.objects;
drop policy if exists "Users can view own or shared memory photos" on storage.objects;
create policy "Users can view own or shared memory photos" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('memory-photos', 'memory-audio')
  );
