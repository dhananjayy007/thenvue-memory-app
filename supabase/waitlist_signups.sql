-- ==============================================================================
-- Migration: Waitlist Signups Table for Mobile App Pre-Launch
-- Description: Captures waitlist emails for upcoming iOS/Android native releases.
-- Security: Two-layer protection (explicit table GRANT restrictions + RLS).
--           Only allows INSERT for anonymous/authenticated visitors.
--           SELECT, UPDATE, DELETE are strictly prohibited for public/anon/authenticated.
--           Only service_role / Supabase Dashboard admins can read or export signups.
-- ==============================================================================

-- 1. Create Table
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(trim(email)) > 3 and email like '%@%'),
  platform text not null default 'all' check (platform in ('ios', 'android', 'all', 'mobile')),
  created_at timestamptz not null default now()
);

-- 2. Performance & Deduplication Indexes
-- Prevent duplicate signups for the same email on the same platform
create unique index if not exists idx_waitlist_signups_email_platform 
  on public.waitlist_signups (lower(trim(email)), platform);

-- Fast lookup / export ordering for admins
create index if not exists idx_waitlist_signups_created_at 
  on public.waitlist_signups (created_at desc);

-- 3. Revoke dangerous table-level privileges from untrusted roles
revoke all on public.waitlist_signups from public;
revoke all on public.waitlist_signups from anon;
revoke all on public.waitlist_signups from authenticated;

-- 4. Grant ONLY INSERT to web clients
grant insert on public.waitlist_signups to anon, authenticated;

-- 5. Enable Row Level Security (RLS)
alter table public.waitlist_signups enable row level security;

-- 6. Insert Policy: Allow anyone (anon or logged-in) to insert their email
drop policy if exists "Allow public insert to waitlist" on public.waitlist_signups;
create policy "Allow public insert to waitlist" on public.waitlist_signups
  for insert
  to anon, authenticated
  with check (true);

-- Note: Because no SELECT/UPDATE/DELETE policies exist, PostgreSQL RLS defaults to DENY
-- for all anon and authenticated users. The waitlist emails cannot be queried by anyone
-- with the public anon key. Only service_role or the Supabase SQL editor can query them.
