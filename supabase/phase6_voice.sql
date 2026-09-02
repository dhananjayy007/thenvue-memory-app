-- Phase 6C: Voice Memories Database & Storage Migration
-- Run this in your Supabase SQL Editor.

-- 1. Expand media_type constraint to allow audio media
alter table public.media drop constraint if exists media_media_type_check;
alter table public.media add constraint media_media_type_check check (media_type in ('image', 'audio'));

-- 2. Create private storage bucket for voice recordings
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-audio',
  'memory-audio',
  false,
  20971520, -- 20MB max file size
  array['audio/webm', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mpeg']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. RLS policies for memory-audio bucket
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

drop policy if exists "Users can delete own memory audio" on storage.objects;
create policy "Users can delete own memory audio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'memory-audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
