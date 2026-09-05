import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import {
  MAX_MEMORY_CHARS,
  memoryTitle,
  rowToMemoryWithSignedMedia,
  rowsToMemories,
  validateCaptureTime,
  validateMediaInputs,
  type MediaRow,
  type MemoryRow,
} from '@/lib/memories'
import { tagMemory } from '@/lib/ai/tag-memory'
import { embedMemorySafe } from '@/lib/ai/embed-memory'

export const dynamic = 'force-dynamic'

const memoryColumns = 'id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood, media(id, memory_id, user_id, storage_path, media_type, file_name, file_size, created_at)'
const bareMemoryColumns = 'id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood'
const mediaColumns = 'id, memory_id, user_id, storage_path, media_type, file_name, file_size, created_at'

export async function GET(request: NextRequest) {
  const auth = await authenticatedClient(request)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100)
  const cursor = searchParams.get('cursor') // format: timestamp or offset

  let query = auth.client
    .from('memories')
    .select(memoryColumns)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })

  if (cursor) {
    // If cursor is a valid ISO timestamp or date
    query = query.lt('occurred_at', cursor)
  }

  // Fetch limit + 1 to detect if there is a next page
  query = query.limit(limit + 1)

  const { data, error } = await query

  if (error) return serverError(error.message)

  const rows = (data as MemoryRow[]) || []
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const memories = await rowsToMemories(auth.client, pageRows)
  const nextCursor = hasMore && pageRows.length > 0
    ? (pageRows[pageRows.length - 1] as any).occurred_at || `${pageRows[pageRows.length - 1].occurred_on}T${pageRows[pageRows.length - 1].occurred_time || '12:00:00'}Z`
    : null

  return NextResponse.json({
    memories,
    nextCursor,
    hasMore,
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticatedClient(request)
  if (auth instanceof NextResponse) return auth

  const payload = await jsonBody(request)
  if (payload instanceof NextResponse) return payload

  const text = typeof payload.text === 'string' ? payload.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
  if (text.length > MAX_MEMORY_CHARS) {
    return NextResponse.json({ error: `Text must be ${MAX_MEMORY_CHARS.toLocaleString()} characters or less.` }, { status: 400 })
  }

  try {
    const capturedAt = validateCaptureTime(payload.capturedAt)
    const media = validateMediaInputs(payload.media ?? [], auth.user.id)
    const explicitPlace = optionalString(payload.place, 120)
    const explicitPeople = optionalStrings(payload.people, 20, 80)
    const explicitTopics = optionalStrings(payload.topics, 10, 40)
    const explicitMood = optionalString(payload.mood, 80)
    const place = explicitPlace || 'Home'
    const people = explicitPeople
    const topics = explicitTopics
    const mood = explicitMood || 'calm'

    const { data: memory, error: memoryError } = await auth.client
      .from('memories')
      .insert({
        user_id: auth.user.id,
        title: memoryTitle(text),
        body: text,
        occurred_on: capturedAt.date,
        occurred_time: capturedAt.time,
        place,
        people,
        topics,
        summary: '',
        memory_type: 'moment',
        mood,
        embedding: null,
      })
      .select(bareMemoryColumns)
      .single()
    if (memoryError) return serverError(memoryError.message)

    let createdMedia: MediaRow[] = []
    if (media.length > 0) {
      const { data, error } = await auth.client
        .from('media')
        .insert(media.map((item) => ({
          memory_id: memory.id,
          user_id: auth.user.id,
          storage_path: item.storagePath,
          media_type: item.mediaType,
          file_name: item.fileName,
          file_size: item.fileSize,
        })))
        .select(mediaColumns)
      if (error) {
        await auth.client.storage.from('memory-photos').remove(media.map((item) => item.storagePath))
        await auth.client.from('memories').delete().eq('id', memory.id)
        return serverError(error.message)
      }
      createdMedia = data as MediaRow[]
    }

    // Trigger AI enrichment in background safely
    (async () => {
      try {
        const tags = await tagMemory(text)
        const finalPlace = explicitPlace || tags.places[0] || 'Home'
        const finalPeople = explicitPeople.length ? explicitPeople : tags.people
        const finalTopics = explicitTopics.length ? explicitTopics : tags.topics
        const finalMood = explicitMood || tags.mood

        const embedding = await embedMemorySafe({
          text,
          summary: tags.summary,
          people: finalPeople,
          place: finalPlace,
          topics: finalTopics,
          memoryType: tags.memoryType,
          mood: finalMood,
        })

        await auth.client
          .from('memories')
          .update({
            place: finalPlace,
            people: finalPeople,
            topics: finalTopics,
            summary: tags.summary,
            memory_type: tags.memoryType,
            mood: finalMood,
            embedding,
            updated_at: new Date().toISOString(),
          })
          .eq('id', memory.id)
      } catch (e) {
        console.error('API async enrichment error:', e)
      }
    })()

    return NextResponse.json(
      { memory: await rowToMemoryWithSignedMedia(auth.client, { ...memory, media: createdMedia } as MemoryRow) },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid memory.' }, { status: 400 })
  }
}

async function authenticatedClient(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!token || !url || !key) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  return { client, user }
}

async function jsonBody(request: NextRequest): Promise<Record<string, unknown> | NextResponse> {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
    return body as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }
}

function optionalString(value: unknown, maximumLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maximumLength) : ''
}

function optionalStrings(value: unknown, maximumItems: number, maximumLength: number) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))]
    .slice(0, maximumItems)
    .map((item) => item.slice(0, maximumLength))
}

function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 })
}
