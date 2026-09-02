-- Phase 5B: Embeddings + Semantic Memory Retrieval Migration
-- Run this in your Supabase SQL Editor to enable pgvector, embedding columns, and semantic search RPC.

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Ensure embedding column exists on public.memories (768 dimensions for Gemini embeddings)
alter table public.memories add column if not exists embedding vector(768);

-- 3. Create HNSW index for fast approximate nearest neighbor cosine similarity search
-- (hnsw is standard in pgvector >= 0.5.0 on PostgreSQL 15+)
create index if not exists memories_embedding_hnsw_idx
  on public.memories
  using hnsw (embedding vector_cosine_ops)
  where deleted_at is null;

-- 4. Create semantic search RPC function with strict user isolation
-- Uses security invoker so RLS policies on memories are enforced, and explicitly filters by auth.uid()
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
set search_path = ''
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

-- 5. Grant execute permission to authenticated users
grant execute on function public.match_memories(vector(768), float, int) to authenticated;
