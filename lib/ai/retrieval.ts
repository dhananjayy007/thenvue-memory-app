import type { SupabaseClient } from '@supabase/supabase-js'
import { searchSemanticMemories } from '@/lib/ai/search-memories'
import { rowsToMemories, type MediaRow, type MemoryRow } from '@/lib/memories'
import type { Memory } from '@/types/memory'

export type TemporalFilter = {
  startDate?: string
  endDate?: string
  preferredOrder?: 'asc' | 'desc'
  temporalLabel?: string
}

export type RetrievalOptions = {
  client: SupabaseClient
  query: string
  limit?: number
  temporalFilter?: TemporalFilter
  person?: string
  place?: string
  topic?: string
}

/**
 * Deterministically extracts temporal constraints from natural language questions.
 */
export function parseTemporalFilters(query: string, now = new Date()): TemporalFilter | null {
  const q = query.toLowerCase()
  const currentYear = now.getFullYear()

  // Match specific 4-digit years (e.g., 2024, 2025, 2026)
  const yearMatch = q.match(/\b(20\d\d)\b/)
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10)
    // If "summer 2025"
    if (q.includes('summer')) {
      return { startDate: `${year}-06-01`, endDate: `${year}-08-31`, temporalLabel: `Summer ${year}` }
    }
    // If "winter 2025"
    if (q.includes('winter')) {
      return { startDate: `${year}-11-01`, endDate: `${year + 1}-02-28`, temporalLabel: `Winter ${year}` }
    }
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31`, temporalLabel: `Year ${year}` }
  }

  // "last year"
  if (q.includes('last year')) {
    const targetYear = currentYear - 1
    return { startDate: `${targetYear}-01-01`, endDate: `${targetYear}-12-31`, temporalLabel: `Last year (${targetYear})` }
  }

  // "this year"
  if (q.includes('this year')) {
    return { startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, temporalLabel: `This year (${currentYear})` }
  }

  // "last month"
  if (q.includes('last month')) {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevYear = prevMonthDate.getFullYear()
    const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(prevYear, prevMonthDate.getMonth() + 1, 0).getDate()
    return {
      startDate: `${prevYear}-${prevMonth}-01`,
      endDate: `${prevYear}-${prevMonth}-${String(lastDay).padStart(2, '0')}`,
      temporalLabel: 'Last month',
    }
  }

  // "this month"
  if (q.includes('this month')) {
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(currentYear, now.getMonth() + 1, 0).getDate()
    return {
      startDate: `${currentYear}-${m}-01`,
      endDate: `${currentYear}-${m}-${String(lastDay).padStart(2, '0')}`,
      temporalLabel: 'This month',
    }
  }

  // "one year ago" / "1 year ago"
  if (q.includes('one year ago') || q.includes('1 year ago')) {
    const target = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const start = new Date(target.getTime() - 30 * 24 * 60 * 60 * 1000)
    const end = new Date(target.getTime() + 30 * 24 * 60 * 60 * 1000)
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      temporalLabel: 'Around one year ago',
    }
  }

  // "first time" / "earliest"
  if (q.includes('first time') || q.includes('earliest') || q.includes('first mention') || q.includes('first started')) {
    return { preferredOrder: 'asc', temporalLabel: 'Earliest' }
  }

  // "last time" / "latest" / "most recent"
  if (q.includes('last time') || q.includes('most recent') || q.includes('latest')) {
    return { preferredOrder: 'desc', temporalLabel: 'Latest' }
  }

  return null
}

/**
 * Reusable memory retrieval combining vector semantic search, temporal filtering,
 * and structured metadata constraints while strictly preserving authenticated user isolation.
 */
export async function retrieveGroundedMemories({
  client,
  query,
  limit = 8,
  temporalFilter,
  person,
  place,
  topic,
}: RetrievalOptions): Promise<Memory[]> {
  const filter = temporalFilter ?? parseTemporalFilters(query)

  // 1. Run semantic retrieval
  const semanticResults = await searchSemanticMemories({
    client,
    query,
    limit: Math.max(limit * 2, 12),
    threshold: 0.0,
  })

  // 2. If explicit structured or date-range filters exist, also query the database directly for candidates
  let structuredCandidates: Memory[] = []
  if (filter?.startDate || filter?.endDate || person || place || topic) {
    let dbQuery = client
      .from('memories')
      .select('id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood')
      .is('deleted_at', null)

    if (filter?.startDate) {
      dbQuery = dbQuery.gte('occurred_on', filter.startDate)
    }
    if (filter?.endDate) {
      dbQuery = dbQuery.lte('occurred_on', filter.endDate)
    }
    if (person) {
      dbQuery = dbQuery.contains('people', [person])
    }
    if (topic) {
      dbQuery = dbQuery.contains('topics', [topic])
    }
    if (place) {
      dbQuery = dbQuery.ilike('place', `%${place}%`)
    }

    dbQuery = dbQuery.order('occurred_on', { ascending: filter?.preferredOrder === 'asc' })
    dbQuery = dbQuery.limit(limit * 2)

    const { data: dbRows, error: dbError } = await dbQuery
    if (!dbError && dbRows && dbRows.length > 0) {
      // Fetch media
      const ids = dbRows.map((r) => r.id)
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

      const fullRows: MemoryRow[] = dbRows.map((r) => ({
        ...r,
        media: mediaByMemory.get(r.id) ?? [],
      }))

      structuredCandidates = await rowsToMemories(client, fullRows)
    }
  }

  // 3. Merge, filter, and score candidates
  const seen = new Set<string>()
  const merged: Memory[] = []

  // If a temporal filter was applied, prioritize semantic results that fit the date range
  const filteredSemantic = semanticResults.filter((m) => {
    if (filter?.startDate && m.date < filter.startDate) return false
    if (filter?.endDate && m.date > filter.endDate) return false
    return true
  })

  // Add matching semantic results first
  for (const m of filteredSemantic) {
    if (!seen.has(m.id)) {
      seen.add(m.id)
      merged.push(m)
    }
  }

  // Then add structured filter matches
  for (const m of structuredCandidates) {
    if (!seen.has(m.id)) {
      seen.add(m.id)
      merged.push(m)
    }
  }

  // If no date-filtered results were found, fall back to unfiltered semantic results
  if (merged.length === 0) {
    for (const m of semanticResults) {
      if (!seen.has(m.id)) {
        seen.add(m.id)
        merged.push(m)
      }
    }
  }

  // If query asks for "first time" / "earliest", sort chronologically
  if (filter?.preferredOrder === 'asc') {
    merged.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }

  return merged.slice(0, limit)
}
