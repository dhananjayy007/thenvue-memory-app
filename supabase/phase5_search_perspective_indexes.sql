-- =========================================================================
-- Phase 5: Search & Perspectives Performance Optimization Indexes
-- Run this in your Supabase Dashboard -> SQL Editor -> New query -> Run
-- =========================================================================

-- 1. Enable pg_trgm for fast fuzzy / prefix searches
create extension if not exists pg_trgm;

-- 2. Fast profile / user search indexes
create index if not exists idx_profiles_display_name_trgm on public.profiles using gin (display_name gin_trgm_ops);
create index if not exists idx_profiles_display_name_lower on public.profiles (lower(display_name));

-- 3. Fast perspective pagination indexes (ordered by created_at)
create index if not exists idx_perspectives_memory_created on public.memory_perspectives (memory_id, created_at asc);
create index if not exists idx_media_perspective_id on public.media (perspective_id);
