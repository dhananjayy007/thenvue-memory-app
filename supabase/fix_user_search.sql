-- =========================================================================
-- Fix User Search & Friend Discovery for Shared Memories in Thenvue
-- Run this in your Supabase Dashboard -> SQL Editor -> New query -> Run
-- =========================================================================

-- 1. Allow authenticated users to search/discover profiles for sharing
drop policy if exists "select own profile" on public.profiles;
drop policy if exists "allow authenticated to view profiles" on public.profiles;
create policy "allow authenticated to view profiles" on public.profiles
for select to authenticated using (true);

-- 2. Create or replace the secure user search function (searches both profiles and auth.users)
create or replace function public.search_users_to_invite(search_query text default '')
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
    u.id,
    coalesce(nullif(p.display_name, ''), split_part(u.email, '@', 1), 'Thenvue User') as display_name,
    coalesce(u.email, '') as email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id <> v_uid
    and (
      search_query is null
      or search_query = ''
      or coalesce(p.display_name, '') ilike '%' || search_query || '%'
      or coalesce(u.email, '') ilike '%' || search_query || '%'
      or split_part(u.email, '@', 1) ilike '%' || search_query || '%'
    )
  limit 20;
end;
$$;

grant execute on function public.search_users_to_invite(text) to authenticated;
