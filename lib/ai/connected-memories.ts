import type { SupabaseClient } from '@supabase/supabase-js'
import { rowsToMemories, type MediaRow, type MemoryRow } from '@/lib/memories'
import type { Memory } from '@/types/memory'

export type ConnectedMemory = Memory & {
  connectionScore: number
  connectionReason: string
  relationshipType: 'people' | 'place' | 'topic' | 'semantic' | 'time'
}

type MemoryWithEmbeddingRow = MemoryRow & {
  embedding?: number[] | string | null
}

function parseVector(val: unknown): number[] | null {
  if (Array.isArray(val)) return val as number[]
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    } catch {
      const match = val.replace(/^\[|\]$/g, '').split(',').map((n) => parseFloat(n.trim())).filter((n) => !isNaN(n))
      if (match.length > 0) return match
    }
  }
  return null
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Calculates time relationship between two dates (YYYY-MM-DD).
 */
function analyzeTimeRelationship(
  sourceDate: string,
  targetDate: string
): { score: number; reason: string | null } {
  const d1 = new Date(`${sourceDate}T12:00:00Z`).getTime()
  const d2 = new Date(`${targetDate}T12:00:00Z`).getTime()
  const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24))

  // Anniversary: ~1 year apart (+-7 days)
  const diffAbs = Math.abs(diffDays)
  if (diffAbs >= 358 && diffAbs <= 372) {
    return {
      score: 0.25,
      reason: diffDays < 0 ? 'Happened around the same time last year.' : 'Happened around the same time one year later.',
    }
  }

  // Temporal proximity: within 5 days
  if (diffAbs > 0 && diffAbs <= 5) {
    const unit = diffAbs === 1 ? 'day' : 'days'
    const direction = diffDays < 0 ? 'earlier' : 'later'
    return {
      score: 0.2,
      reason: `Happened ${diffAbs} ${unit} ${direction}.`,
    }
  }

  return { score: 0, reason: null }
}

/**
 * Finds meaningfully connected memories for a target memory.
 * Combines semantic similarity, shared people, shared places, shared topics, and time patterns.
 * Discards weak connections and returns human-readable explanations.
 */
export async function findConnectedMemories(
  client: SupabaseClient,
  memoryId: string,
  limit = 3
): Promise<ConnectedMemory[]> {
  // 1. Fetch the source memory
  const { data: sourceData, error: sourceError } = await client
    .from('memories')
    .select('id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood, embedding')
    .eq('id', memoryId)
    .is('deleted_at', null)
    .single()

  if (sourceError || !sourceData) return []

  const sourceEmbedding = parseVector(sourceData.embedding)
  const sourcePeople = new Set((sourceData.people ?? []).map((p: string) => p.toLowerCase()))
  const sourceTopics = new Set((sourceData.topics ?? []).map((t: string) => t.toLowerCase()))
  const sourcePlace = (sourceData.place ?? '').trim().toLowerCase()
  const hasSpecificPlace = sourcePlace && sourcePlace !== 'home'

  // 2. Fetch active candidate memories
  const { data: candidatesData, error: candidatesError } = await client
    .from('memories')
    .select('id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood, embedding')
    .neq('id', memoryId)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
    .limit(100)

  if (candidatesError || !candidatesData || candidatesData.length === 0) return []

  // 3. Score candidates across multi-signal weights
  type CandidateScore = {
    row: MemoryWithEmbeddingRow
    score: number
    reason: string
    relationshipType: 'people' | 'place' | 'topic' | 'semantic' | 'time'
  }

  const scoredCandidates: CandidateScore[] = []

  for (const cand of candidatesData as MemoryWithEmbeddingRow[]) {
    let score = 0
    let primaryReason = ''
    let relationshipType: 'people' | 'place' | 'topic' | 'semantic' | 'time' = 'semantic'

    // Signal A: Shared people
    const sharedPeople = (cand.people ?? []).filter((p: string) => sourcePeople.has(p.toLowerCase()))
    if (sharedPeople.length > 0) {
      const peopleScore = Math.min(0.5, sharedPeople.length * 0.3)
      score += peopleScore
      primaryReason = `You were with ${sharedPeople[0]} in both memories.`
      relationshipType = 'people'
    }

    // Signal B: Shared place (non-generic)
    const candPlace = (cand.place ?? '').trim().toLowerCase()
    if (hasSpecificPlace && candPlace === sourcePlace) {
      score += 0.3
      if (!primaryReason) {
        primaryReason = `Both memories happened at ${cand.place}.`
        relationshipType = 'place'
      }
    }

    // Signal C: Shared topics
    const sharedTopics = (cand.topics ?? []).filter((t: string) => sourceTopics.has(t.toLowerCase()))
    if (sharedTopics.length > 0) {
      const topicScore = Math.min(0.35, sharedTopics.length * 0.2)
      score += topicScore
      if (!primaryReason) {
        primaryReason = `Both moments relate to ${sharedTopics[0]}.`
        relationshipType = 'topic'
      }
    }

    // Signal D: Semantic vector similarity
    const candEmbedding = parseVector(cand.embedding)
    let semSim = 0
    if (sourceEmbedding && candEmbedding && sourceEmbedding.length === candEmbedding.length) {
      semSim = cosineSimilarity(sourceEmbedding, candEmbedding)
      if (semSim > 0.55) {
        score += semSim * 0.45
        if (!primaryReason && semSim >= 0.65) {
          primaryReason = 'These memories are about similar experiences.'
          relationshipType = 'semantic'
        }
      }
    }

    // Signal E: Time patterns
    const timeRelation = analyzeTimeRelationship(sourceData.occurred_on, cand.occurred_on)
    if (timeRelation.score > 0) {
      score += timeRelation.score
      if (!primaryReason && timeRelation.reason) {
        primaryReason = timeRelation.reason
        relationshipType = 'time'
      }
    }

    // Meaningful quality threshold: must cross 0.40 or have strong semantic similarity
    if (score >= 0.40 && primaryReason) {
      scoredCandidates.push({
        row: cand,
        score,
        reason: primaryReason,
        relationshipType,
      })
    }
  }

  // 4. Sort by score descending and take top N
  scoredCandidates.sort((a, b) => b.score - a.score)
  const topCandidates = scoredCandidates.slice(0, limit)
  if (topCandidates.length === 0) return []

  // 5. Fetch media for top candidates
  const ids = topCandidates.map((c) => c.row.id)
  const { data: mediaData } = await client
    .from('media')
    .select('id, memory_id, user_id, storage_path, media_type, file_name, file_size, created_at')
    .in('memory_id', ids)

  const mediaByMemory = new Map<string, MediaRow[]>()
  for (const item of (mediaData ?? []) as MediaRow[]) {
    const list = mediaByMemory.get(item.memory_id) ?? []
    list.push(item)
    mediaByMemory.set(item.memory_id, list)
  }

  const rowsWithMedia: MemoryRow[] = topCandidates.map((c) => ({
    ...c.row,
    media: mediaByMemory.get(c.row.id) ?? [],
  }))

  const memories = await rowsToMemories(client, rowsWithMedia)

  return memories.map((mem, index) => ({
    ...mem,
    connectionScore: topCandidates[index].score,
    connectionReason: topCandidates[index].reason,
    relationshipType: topCandidates[index].relationshipType,
  }))
}
