import { embedText } from '@/lib/ai/provider'

export type MemoryEmbeddingInput = {
  text: string
  summary?: string
  people?: string[]
  place?: string
  places?: string[]
  topics?: string[]
  memoryType?: string
  mood?: string
}

/**
 * Builds the structured document used to generate the embedding.
 * Includes original memory text plus AI-derived summary, topics, people, places,
 * memory type, and mood to optimize for semantic retrieval.
 * The original text is never overwritten and remains the source of truth.
 */
export function buildMemorySearchDocument(params: MemoryEmbeddingInput): string {
  const parts: string[] = []

  if (params.text?.trim()) {
    parts.push(`Memory:\n${params.text.trim()}`)
  }
  if (params.summary?.trim()) {
    parts.push(`Summary:\n${params.summary.trim()}`)
  }
  if (params.topics && params.topics.length > 0) {
    parts.push(`Topics:\n${params.topics.join(', ')}`)
  }
  if (params.people && params.people.length > 0) {
    parts.push(`People:\n${params.people.join(', ')}`)
  }
  const place = params.place?.trim() || params.places?.filter(Boolean).join(', ')
  if (place) {
    parts.push(`Place:\n${place}`)
  }
  if (params.memoryType?.trim()) {
    parts.push(`Type:\n${params.memoryType.trim()}`)
  }
  if (params.mood?.trim() && params.mood !== 'Unsorted') {
    parts.push(`Mood:\n${params.mood.trim()}`)
  }

  return parts.join('\n\n')
}

/** Legacy alias for backwards compatibility. */
export function embeddingSourceText(params: MemoryEmbeddingInput): string {
  return buildMemorySearchDocument(params)
}

/**
 * Generates an embedding vector for a memory from its structured representation.
 * Throws if the embedding call fails.
 */
export async function embedMemory(params: MemoryEmbeddingInput): Promise<number[]> {
  const doc = buildMemorySearchDocument(params)
  return embedText(doc)
}

/**
 * Safe embedding generation that never throws.
 * If AI embedding fails (e.g. rate limits, missing key, network issues),
 * it logs the error and returns null so memory creation and CRUD operations
 * are never blocked or broken.
 */
export async function embedMemorySafe(params: MemoryEmbeddingInput): Promise<number[] | null> {
  try {
    return await embedMemory(params)
  } catch (error) {
    console.error('embedMemorySafe failed, skipping embedding for memory:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Generates an embedding vector for a user's natural language search query.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const trimmed = query.trim()
  if (!trimmed) throw new Error('Query cannot be empty')
  return embedText(trimmed)
}

/**
 * Safe query embedding generator that returns null on error without throwing.
 */
export async function embedQuerySafe(query: string): Promise<number[] | null> {
  try {
    return await embedQuery(query)
  } catch (error) {
    console.error('embedQuerySafe failed:', error instanceof Error ? error.message : error)
    return null
  }
}
