import type { SupabaseClient } from '@supabase/supabase-js'
import { embedQuerySafe } from '@/lib/ai/embed-memory'
import { rowsToMemories, type MediaRow, type MemoryRow } from '@/lib/memories'
import type { Memory } from '@/types/memory'

export type SemanticMemoryResult = Memory & {
  similarity: number
}

export type SearchMemoriesOptions = {
  client: SupabaseClient
  query: string
  limit?: number
  threshold?: number
}

/**
 * Searches memories semantically using vector similarity.
 *
 * 1. Generates an embedding for the user's natural language query.
 * 2. Executes `match_memories` RPC on Supabase PostgreSQL (pgvector).
 * 3. Enforces user isolation at the database layer (security invoker + auth.uid()).
 * 4. Resolves signed URLs for any attached media assets.
 * 5. Returns memories ranked by cosine similarity score.
 */
export async function searchSemanticMemories({
  client,
  query,
  limit = 10,
  threshold = 0.0,
}: SearchMemoriesOptions): Promise<SemanticMemoryResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  // 1. Generate query embedding
  const queryEmbedding = await embedQuerySafe(trimmed)
  if (!queryEmbedding) {
    console.warn('Semantic search: unable to generate query embedding.')
    return []
  }

  // 2. Query Postgres pgvector using the match_memories RPC
  const { data: matchedRows, error } = await client.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('match_memories RPC error:', error.message)
    return []
  }

  if (!matchedRows || matchedRows.length === 0) {
    return []
  }

  // 3. Fetch any media for the matched memories
  const memoryIds = matchedRows.map((r: { id: string }) => r.id)
  let mediaByMemoryId = new Map<string, MediaRow[]>()

  if (memoryIds.length > 0) {
    const { data: mediaData, error: mediaError } = await client
      .from('media')
      .select('id, memory_id, user_id, storage_path, media_type, file_name, file_size, created_at')
      .in('memory_id', memoryIds)

    if (!mediaError && mediaData) {
      for (const item of mediaData as MediaRow[]) {
        const list = mediaByMemoryId.get(item.memory_id) ?? []
        list.push(item)
        mediaByMemoryId.set(item.memory_id, list)
      }
    }
  }

  // 4. Attach media and format into standard Memory objects with signed URLs
  const fullRows: MemoryRow[] = matchedRows.map((r: {
    id: string
    title: string
    body: string
    occurred_on: string
    occurred_time: string
    place: string
    people: string[]
    topics: string[]
    summary: string
    memory_type: string
    mood: string
  }) => ({
    ...r,
    media: mediaByMemoryId.get(r.id) ?? [],
  }))

  const memories = await rowsToMemories(client, fullRows)

  // 5. Merge similarity scores
  const similarityMap = new Map<string, number>(
    matchedRows.map((r: { id: string; similarity: number }) => [r.id, r.similarity])
  )

  return memories.map((memory) => ({
    ...memory,
    similarity: similarityMap.get(memory.id) ?? 0,
  }))
}
