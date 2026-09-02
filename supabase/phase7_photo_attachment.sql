-- Phase 7: Add Photo to Existing Memory with Same-Day Restriction
-- Run this in your Supabase SQL Editor to enable server-side validated photo attachments.

-- 1. Pre-upload verification function: checks eligibility before upload
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

-- 2. Atomic attachment function: attaches media record after upload with re-verification
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
