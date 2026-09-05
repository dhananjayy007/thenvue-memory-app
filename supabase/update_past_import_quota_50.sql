-- ==========================================================================
-- Update Past Photo Import Quota to 50
-- Run this in Supabase SQL Editor if you use database RPC enforcement
-- ==========================================================================

create or replace function public.get_user_past_import_quota(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used integer;
  v_limit constant integer := 50;
  v_remaining integer;
begin
  -- Count active past import assets (either in imported_assets table or active media with past_import)
  select count(distinct coalesce(ia.storage_path, m.storage_path))
  into v_used
  from public.imported_assets ia
  full outer join public.media m
    on m.storage_path = ia.storage_path
    and m.user_id = p_user_id
    and m.source_type = 'past_import'
  where (ia.user_id = p_user_id and ia.source_type = 'past_import')
     or (m.user_id = p_user_id and m.source_type = 'past_import');

  v_used := coalesce(v_used, 0);
  v_remaining := greatest(0, v_limit - v_used);

  return jsonb_build_object(
    'used', v_used,
    'limit', v_limit,
    'remaining', v_remaining
  );
end;
$$;

grant execute on function public.get_user_past_import_quota(uuid) to authenticated;
