import type { SupabaseClient } from '@supabase/supabase-js'
import { rowsToMemories, type MediaRow, type MemoryRow } from '@/lib/memories'
import type { Memory } from '@/types/memory'

export type RediscoverResult = {
  memory: Memory
  label: string
  isExactDay: boolean
  yearsAgo: number
  totalCandidatesCount: number
}

/**
 * Deterministically finds historical memories for "On This Day" and "Around This Time".
 * Current-year memories are never included as historical rediscovery.
 */
export async function getRediscoverMemory(
  client: SupabaseClient,
  referenceDate = new Date()
): Promise<RediscoverResult | null> {
  const currentYear = referenceDate.getFullYear()
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0')
  const day = String(referenceDate.getDate()).padStart(2, '0')
  const currentMonthDay = `${month}-${day}`

  // Fetch all historical memories (occurred_on before Jan 1 of current year)
  const cutoffDate = `${currentYear}-01-01`
  const { data: rawRows, error } = await client
    .from('memories')
    .select('id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood')
    .is('deleted_at', null)
    .lt('occurred_on', cutoffDate)
    .order('occurred_on', { ascending: false })

  if (error || !rawRows || rawRows.length === 0) {
    return null
  }

  // Fetch media for these rows
  const ids = rawRows.map((r) => r.id)
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

  const fullRows: MemoryRow[] = rawRows.map((r) => ({
    ...r,
    media: mediaByMemory.get(r.id) ?? [],
  }))

  const historicalMemories = await rowsToMemories(client, fullRows)

  // 1. Check for exact "On This Day" matches (same MM-DD)
  const exactMatches = historicalMemories.filter((m) => {
    const memMonthDay = m.date.slice(5) // 'YYYY-MM-DD' -> 'MM-DD'
    return memMonthDay === currentMonthDay
  })

  if (exactMatches.length > 0) {
    const prioritized = prioritizeMemories(exactMatches)
    const top = prioritized[0]
    const memoryYear = parseInt(top.date.slice(0, 4), 10)
    const yearsAgo = currentYear - memoryYear
    const label = yearsAgo === 1 ? '1 year ago today' : `${yearsAgo} years ago today`

    return {
      memory: top,
      label,
      isExactDay: true,
      yearsAgo,
      totalCandidatesCount: exactMatches.length,
    }
  }

  // 2. Fall back to "Around This Time" window (+/- 7 days in previous years)
  const refDayOfYear = getDayOfYear(referenceDate)
  const aroundMatches = historicalMemories.filter((m) => {
    const memDate = new Date(`${m.date}T12:00:00Z`)
    const memDayOfYear = getDayOfYear(memDate)
    const diff = Math.abs(memDayOfYear - refDayOfYear)
    // Handle wrap-around near year ends
    const circularDiff = Math.min(diff, 365 - diff)
    return circularDiff <= 7
  })

  if (aroundMatches.length > 0) {
    const prioritized = prioritizeMemories(aroundMatches)
    const top = prioritized[0]
    const memoryYear = parseInt(top.date.slice(0, 4), 10)
    const yearsAgo = currentYear - memoryYear
    const label =
      yearsAgo === 1
        ? 'Around this time last year'
        : `Around this time ${yearsAgo} years ago`

    return {
      memory: top,
      label,
      isExactDay: false,
      yearsAgo,
      totalCandidatesCount: aroundMatches.length,
    }
  }

  return null
}

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Deterministically ranks candidates giving priority to memories with rich content:
 * Media attachments > Mentions of people/places > AI summary > Text length.
 */
function prioritizeMemories(memories: Memory[]): Memory[] {
  return [...memories].sort((a, b) => {
    const scoreA = calculateMemoryRichness(a)
    const scoreB = calculateMemoryRichness(b)
    return scoreB - scoreA
  })
}

function calculateMemoryRichness(m: Memory): number {
  let score = 0
  if (m.media && m.media.length > 0) score += 10
  if (m.people && m.people.length > 0) score += 4
  if (m.place && m.place.toLowerCase() !== 'home') score += 3
  if (m.summary && m.summary.trim()) score += 3
  score += Math.min(5, Math.floor(m.text.length / 50))
  return score
}
