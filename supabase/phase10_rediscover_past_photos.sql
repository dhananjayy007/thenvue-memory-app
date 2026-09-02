-- Phase 10: Rediscover Your Past / Past Photo Import & Quota Management

-- 1. Extend Media Table with source_type
alter table public.media add column if not exists source_type text not null default 'memory_capture' check (source_type in ('memory_capture', 'past_import', 'shared_perspective'));

-- 2. Import Jobs Table
create table if not exists public.memory_import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('queued', 'processing', 'clustering', 'understanding', 'review', 'completed', 'failed', 'cancelled')) default 'queued',
  total_assets integer not null default 0,
  processed_assets integer not null default 0,
  created_memories integer not null default 0,
  failed_assets integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- 3. Memory Clusters Table (holds detected moments before user review)
create table if not exists public.memory_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  import_job_id uuid references public.memory_import_jobs (id) on delete cascade,
  title text not null default 'Detected Moment',
  summary text not null default '',
  suggested_date date,
  location_name text not null default '',
  latitude double precision,
  longitude double precision,
  people text[] not null default '{}',
  topics text[] not null default '{}',
  mood text not null default '',
  photo_count integer not null default 0,
  confidence double precision not null default 1.0,
  status text not null check (status in ('pending', 'approved', 'rejected', 'edited')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Imported Assets Table (holds individual imported past photos)
create table if not exists public.imported_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  import_job_id uuid references public.memory_import_jobs (id) on delete cascade,
  cluster_id uuid references public.memory_clusters (id) on delete set null,
  memory_id uuid references public.memories (id) on delete set null,
  media_id uuid references public.media (id) on delete set null,
  storage_path text not null,
  source_type text not null default 'past_import' check (source_type = 'past_import'),
  captured_at timestamptz,
  latitude double precision,
  longitude double precision,
  width integer,
  height integer,
  mime_type text not null default 'image/jpeg',
  file_size integer not null default 0,
  content_hash text,
  perceptual_hash text,
  processing_status text not null check (processing_status in ('pending', 'processed', 'duplicate', 'failed')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists memory_import_jobs_user_idx on public.memory_import_jobs (user_id, created_at desc);
create index if not exists memory_clusters_user_job_idx on public.memory_clusters (user_id, import_job_id);
create index if not exists imported_assets_user_source_idx on public.imported_assets (user_id, source_type);
create index if not exists imported_assets_user_hash_idx on public.imported_assets (user_id, content_hash);
create index if not exists imported_assets_cluster_idx on public.imported_assets (cluster_id);
create index if not exists media_source_type_idx on public.media (user_id, source_type);

-- ==========================================================================
-- Server-Side Atomic Quota Enforcement Function (100 Active Past-Import Photos)
-- ==========================================================================

create or replace function public.get_user_past_import_quota(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used integer;
  v_limit constant integer := 100;
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

-- ==========================================================================
-- RLS Policies
-- ==========================================================================

alter table public.memory_import_jobs enable row level security;
alter table public.memory_clusters enable row level security;
alter table public.imported_assets enable row level security;

-- Import Jobs Policies
drop policy if exists "select own import jobs" on public.memory_import_jobs;
create policy "select own import jobs" on public.memory_import_jobs
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "insert own import jobs" on public.memory_import_jobs;
create policy "insert own import jobs" on public.memory_import_jobs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "update own import jobs" on public.memory_import_jobs;
create policy "update own import jobs" on public.memory_import_jobs
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "delete own import jobs" on public.memory_import_jobs;
create policy "delete own import jobs" on public.memory_import_jobs
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Memory Clusters Policies
drop policy if exists "select own memory clusters" on public.memory_clusters;
create policy "select own memory clusters" on public.memory_clusters
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "insert own memory clusters" on public.memory_clusters;
create policy "insert own memory clusters" on public.memory_clusters
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "update own memory clusters" on public.memory_clusters;
create policy "update own memory clusters" on public.memory_clusters
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "delete own memory clusters" on public.memory_clusters;
create policy "delete own memory clusters" on public.memory_clusters
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Imported Assets Policies
drop policy if exists "select own imported assets" on public.imported_assets;
create policy "select own imported assets" on public.imported_assets
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "insert own imported assets" on public.imported_assets;
create policy "insert own imported assets" on public.imported_assets
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "update own imported assets" on public.imported_assets;
create policy "update own imported assets" on public.imported_assets
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "delete own imported assets" on public.imported_assets;
create policy "delete own imported assets" on public.imported_assets
  for delete to authenticated
  using (user_id = (select auth.uid()));
