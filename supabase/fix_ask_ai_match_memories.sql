-- =========================================================================
-- Fix Ask AI Semantic Search (match_memories RPC)
-- Run this in your Supabase Dashboard -> SQL Editor -> New query -> Run
-- =========================================================================

-- Ensure vector extension exists
create extension if not exists vector;

-- Ensure embedding column exists
alter table public.memories add column if not exists embedding vector(768);

-- Update match_memories function with search_path = public, extensions
-- (Setting search_path = '' was hiding the pgvector <=> cosine distance operator)
create or replace function public.match_memories(
  query_embedding vector(768),
  match_threshold float default 0.0,
  match_count int default 10
)
returns table (
  id uuid,
  title text,
  body text,
  occurred_on date,
  occurred_time time,
  place text,
  people text[],
  topics text[],
  summary text,
  memory_type text,
  mood text,
  similarity float
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  return query
  select
    m.id,
    m.title,
    m.body,
    m.occurred_on,
    m.occurred_time,
    m.place,
    m.people,
    m.topics,
    m.summary,
    m.memory_type,
    m.mood,
    (1 - (m.embedding <=> query_embedding))::float as similarity
  from public.memories m
  where m.deleted_at is null
    and m.embedding is not null
    and (1 - (m.embedding <=> query_embedding)) >= match_threshold
    and m.user_id = (select auth.uid())
  order by m.embedding <=> query_embedding asc
  limit match_count;
end;
$$;

grant execute on function public.match_memories(vector(768), float, int) to authenticated;
