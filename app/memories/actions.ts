'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  currentCaptureTime,
  MAX_MEMORY_CHARS,
  memoryTitle,
  rowToMemory,
  rowToMemoryWithSignedMedia,
  rowsToMemories,
  validateCaptureTime,
  validateMediaInputs,
  type MediaRow,
  type MemoryRow,
} from '@/lib/memories'
import { tagMemory } from '@/lib/ai/tag-memory'
import { embedMemorySafe } from '@/lib/ai/embed-memory'
import { searchSemanticMemories, type SemanticMemoryResult } from '@/lib/ai/search-memories'
import { findConnectedMemories, type ConnectedMemory } from '@/lib/ai/connected-memories'
import { answerQuestion, type AskMyLifeResult, type ConversationTurn } from '@/lib/ai/answer-question'
import { extractMentions } from '@/lib/mentions'
import { toValidIsoString } from '@/lib/format'
import { createHash } from 'crypto'
import type {
  Memory,
  MemoryCaptureTime,
  MemoryNotification,
  MemoryParticipant,
  MemoryPerspective,
  NewMediaInput,
  UserSearchResult,
  PastImportQuota,
  MemoryImportJob,
  ImportedAsset,
  MemoryClusterCandidate,
} from '@/types/memory'

const memoryColumns = 'id, user_id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood, source_memory_id, shared_context, media(id, memory_id, perspective_id, user_id, storage_path, media_type, file_name, file_size, created_at)'
const baseMemoryColumns = 'id, user_id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood, media(id, memory_id, user_id, storage_path, media_type, file_name, file_size, created_at)'
const mediaColumns = 'id, memory_id, perspective_id, user_id, storage_path, media_type, file_name, file_size, created_at'

export async function getMemories(): Promise<Memory[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  let rawData: any = null
  const { data, error } = await supabase
    .from('memories')
    .select(memoryColumns)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })

  if (error) {
    if (error.message.includes('perspective_id') || error.message.includes('source_memory_id') || error.message.includes('shared_context')) {
      const fallback = await supabase
        .from('memories')
        .select(baseMemoryColumns)
        .is('deleted_at', null)
        .order('occurred_at', { ascending: false })

      if (fallback.error) throw new Error(fallback.error.message)
      rawData = fallback.data
    } else {
      throw new Error(error.message)
    }
  } else {
    rawData = data
  }

  // Deduplicate: If the shared parent memory is already present in rawData,
  // filter out the secondary cloned personal copy so it is never displayed twice.
  const parentMemoryIds = new Set((rawData || []).map((r: any) => r.id))
  const filteredRows = (rawData || []).filter((r: any) => {
    if (r.source_memory_id && parentMemoryIds.has(r.source_memory_id)) {
      return false
    }
    return true
  })

  return rowsToMemories(supabase, filteredRows as MemoryRow[], user.id)
}

export async function getMemoriesPageAction({
  limit = 20,
  cursor,
}: {
  limit?: number
  cursor?: string
} = {}): Promise<{ memories: Memory[]; nextCursor: string | null; hasMore: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { memories: [], nextCursor: null, hasMore: false }

  const safeLimit = Math.min(Math.max(limit, 1), 100)

  let query = supabase
    .from('memories')
    .select(memoryColumns)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })

  if (cursor) {
    query = query.lt('occurred_at', toValidIsoString(cursor))
  }

  query = query.limit(safeLimit + 1)

  let rawData: any = null
  const { data, error } = await query

  if (error) {
    if (error.message.includes('perspective_id') || error.message.includes('source_memory_id') || error.message.includes('shared_context')) {
      let fallbackQuery = supabase
        .from('memories')
        .select(baseMemoryColumns)
        .is('deleted_at', null)
        .order('occurred_at', { ascending: false })

      if (cursor) {
        fallbackQuery = fallbackQuery.lt('occurred_at', toValidIsoString(cursor))
      }
      fallbackQuery = fallbackQuery.limit(safeLimit + 1)

      const fallback = await fallbackQuery
      if (fallback.error) throw new Error(fallback.error.message)
      rawData = fallback.data
    } else {
      throw new Error(error.message)
    }
  } else {
    rawData = data
  }

  const rows = (rawData || []) as any[]
  const hasMore = rows.length > safeLimit
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows

  // Deduplicate secondary clones if parent is present in this page
  const parentMemoryIds = new Set(pageRows.map((r: any) => r.id))
  const filteredRows = pageRows.filter((r: any) => {
    if (r.source_memory_id && parentMemoryIds.has(r.source_memory_id)) {
      return false
    }
    return true
  })

  const memories = await rowsToMemories(supabase, filteredRows as MemoryRow[], user.id)
  const lastRow = pageRows[pageRows.length - 1]
  const nextCursor = hasMore && pageRows.length > 0
    ? toValidIsoString((lastRow as any)?.occurred_at || lastRow?.occurred_on, lastRow?.occurred_time)
    : null

  return {
    memories,
    nextCursor,
    hasMore,
  }
}

export async function searchMemoriesAction(query: string, limit = 10): Promise<SemanticMemoryResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return searchSemanticMemories({
    client: supabase,
    query,
    limit,
  })
}

export async function getConnectedMemoriesAction(memoryId: string, limit = 3): Promise<ConnectedMemory[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return findConnectedMemories(supabase, memoryId, limit)
}

export async function askMyLifeAction(
  question: string,
  history: ConversationTurn[] = []
): Promise<AskMyLifeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return answerQuestion(question, supabase, history)
}

export async function backfillMemoryEmbeddingsAction(): Promise<{ processed: number; success: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: rows, error } = await supabase
    .from('memories')
    .select('id, body, summary, place, people, topics, memory_type, mood')
    .is('embedding', null)
    .is('deleted_at', null)

  if (error || !rows) return { processed: 0, success: 0 }

  let success = 0
  for (const row of rows) {
    const embedding = await embedMemorySafe({
      text: row.body,
      summary: row.summary,
      people: row.people,
      place: row.place,
      topics: row.topics,
      memoryType: row.memory_type,
      mood: row.mood,
    })
    if (embedding) {
      const { error: updateError } = await supabase
        .from('memories')
        .update({ embedding })
        .eq('id', row.id)
      if (!updateError) success++
    }
  }

  return { processed: rows.length, success }
}

export async function createMemory(
  text: string,
  mediaInputs: NewMediaInput[] = [],
  capturedAt: MemoryCaptureTime = currentCaptureTime(),
  customPlace?: string
): Promise<Memory> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const body = text.trim()
  if (!body) throw new Error('Write something before saving this memory.')
  if (body.length > MAX_MEMORY_CHARS) throw new Error(`Memories must be ${MAX_MEMORY_CHARS.toLocaleString()} characters or less.`)
  const captureTime = validateCaptureTime(capturedAt)
  const media = validateMediaInputs(mediaInputs, user.id)
  const place = customPlace?.trim() || 'Home'
  const mentionedPeople = extractMentions(body)

  const { data: createdMemory, error: memoryError } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title: memoryTitle(body),
      body,
      occurred_at: new Date().toISOString(),
      occurred_on: captureTime.date,
      occurred_time: captureTime.time,
      place,
      people: mentionedPeople,
      topics: [],
      summary: '',
      memory_type: 'moment',
      mood: 'calm',
      embedding: null,
    })
    .select('id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood')
    .single()

  if (memoryError) throw new Error(memoryError.message)

  let createdMedia: MediaRow[] = []
  if (media.length > 0) {
    const { data, error } = await supabase
      .from('media')
      .insert(media.map((item) => ({
        memory_id: createdMemory.id,
        user_id: user.id,
        storage_path: item.storagePath,
        media_type: item.mediaType,
        file_name: item.fileName,
        file_size: item.fileSize,
      })))
      .select(mediaColumns)

    if (error) {
      await supabase.storage.from('memory-photos').remove(media.map((item) => item.storagePath))
      await supabase.from('memories').delete().eq('id', createdMemory.id)
      throw new Error(error.message)
    }
    createdMedia = data as MediaRow[]
  }

  revalidatePath('/')
  const memoryObj = await rowToMemoryWithSignedMedia(supabase, { ...createdMemory, media: createdMedia } as MemoryRow)
  return { ...memoryObj, isProcessing: true }
}

export async function enrichMemoryAction(memoryId: string, customPlace?: string): Promise<Memory | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: current, error: readErr } = await supabase
    .from('memories')
    .select(memoryColumns)
    .eq('id', memoryId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (readErr || !current) return null

  try {
    const body = current.body || ''
    const tags = await tagMemory(body)
    const place = customPlace?.trim() || (current.place && current.place !== 'Home' ? current.place : (tags.places[0] || 'Home'))
    const mentionedPeople = extractMentions(body)
    const allPeople = [...new Set([...(tags.people || []), ...mentionedPeople])]

    const embedding = await embedMemorySafe({
      text: body,
      summary: tags.summary,
      people: allPeople,
      place,
      topics: tags.topics,
      memoryType: tags.memoryType,
      mood: tags.mood,
    })

    const { data: updated, error: updateErr } = await supabase
      .from('memories')
      .update({
        place,
        people: allPeople,
        topics: tags.topics,
        summary: tags.summary,
        memory_type: tags.memoryType,
        mood: tags.mood,
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryId)
      .eq('user_id', user.id)
      .select(memoryColumns)
      .single()

    if (updateErr || !updated) return null

    // Auto-invite any @mentioned users
    if (mentionedPeople.length > 0) {
      try {
        for (const mentionName of mentionedPeople) {
          const matchingUsers = await searchUsersAction(mentionName)
          const exactMatch = matchingUsers.find(
            (u) =>
              u.displayName.toLowerCase() === mentionName.toLowerCase() ||
              u.email.toLowerCase().startsWith(mentionName.toLowerCase())
          )
          if (exactMatch && exactMatch.id !== user.id) {
            await inviteParticipantsAction(memoryId, [exactMatch.id]).catch(() => {})
          }
        }
      } catch {
        // Non-blocking auto-invite
      }
    }

    revalidatePath('/')
    const memoryObj = await rowToMemoryWithSignedMedia(supabase, updated as MemoryRow, user.id)
    return { ...memoryObj, isProcessing: false, processingStatus: 'completed' }
  } catch (err) {
    console.error('enrichMemoryAction error:', err)
    const memoryObj = await rowToMemoryWithSignedMedia(supabase, current as MemoryRow, user.id)
    return { ...memoryObj, isProcessing: false, processingStatus: 'failed' }
  }
}

export async function retryEnrichmentAction(memoryId: string): Promise<Memory | null> {
  return enrichMemoryAction(memoryId)
}

export async function getRediscoverAction(): Promise<import('@/lib/ai/rediscover').RediscoverResult | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { getRediscoverMemory } = await import('@/lib/ai/rediscover')
  return getRediscoverMemory(supabase, new Date())
}

export async function createVoiceMemoryAction({
  audioBase64,
  mimeType = 'audio/webm',
  fileName = 'voice_recording.webm',
  fileSize,
  capturedAt = currentCaptureTime(),
}: {
  audioBase64: string
  mimeType?: string
  fileName?: string
  fileSize?: number
  capturedAt?: MemoryCaptureTime
}): Promise<Memory> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const captureTime = validateCaptureTime(capturedAt)
  const audioBuffer = Buffer.from(audioBase64, 'base64')
  const actualSize = fileSize || audioBuffer.length

  // 1. Upload audio to private memory-audio bucket
  const fileExt = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm'
  const storagePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from('memory-audio').upload(storagePath, audioBuffer, {
    contentType: mimeType,
    upsert: false,
  })

  if (uploadError) {
    throw new Error(`Audio upload failed: ${uploadError.message}`)
  }

  const initialBody = `[Voice memory recorded on ${captureTime.date}]`

  // 2. Insert memory record immediately (<100ms)
  const { data: createdMemory, error: memoryError } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title: 'Voice memory',
      body: initialBody,
      occurred_at: new Date().toISOString(),
      occurred_on: captureTime.date,
      occurred_time: captureTime.time,
      place: 'Home',
      people: [],
      topics: ['voice'],
      summary: '',
      memory_type: 'Voice',
      mood: 'calm',
      embedding: null,
    })
    .select('id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood')
    .single()

  if (memoryError) {
    await supabase.storage.from('memory-audio').remove([storagePath])
    throw new Error(memoryError.message)
  }

  // 3. Insert media record
  const { data: mediaData, error: mediaError } = await supabase
    .from('media')
    .insert({
      memory_id: createdMemory.id,
      user_id: user.id,
      storage_path: storagePath,
      media_type: 'audio',
      file_name: fileName,
      file_size: actualSize,
    })
    .select(mediaColumns)
    .single()

  if (mediaError) {
    await supabase.storage.from('memory-audio').remove([storagePath])
    await supabase.from('memories').delete().eq('id', createdMemory.id)
    throw new Error(mediaError.message)
  }

  revalidatePath('/')
  const memoryObj = await rowToMemoryWithSignedMedia(supabase, {
    ...createdMemory,
    media: [mediaData as MediaRow],
  } as MemoryRow)
  return { ...memoryObj, isProcessing: true, processingStatus: 'processing' }
}

export async function processVoiceMemoryAction({
  memoryId,
  audioBase64,
  mimeType = 'audio/webm',
}: {
  memoryId: string
  audioBase64: string
  mimeType?: string
}): Promise<Memory | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: current, error: readErr } = await supabase
    .from('memories')
    .select(memoryColumns)
    .eq('id', memoryId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (readErr || !current) return null

  try {
    // 1. Transcribe audio with Gemini
    let transcript = ''
    try {
      const { transcribeAudio } = await import('@/lib/ai/provider')
      transcript = await transcribeAudio(audioBase64, mimeType)
    } catch (err) {
      console.error('Audio transcription encountered an issue:', err)
    }

    const body = transcript.trim() || current.body || `[Voice memory recorded on ${current.occurred_on}]`

    // 2. Tag & embed
    const tags = await tagMemory(body)
    const place = tags.places[0] || current.place || 'Home'

    const embedding = await embedMemorySafe({
      text: body,
      summary: tags.summary,
      people: tags.people,
      place,
      topics: tags.topics,
      memoryType: 'Voice',
      mood: tags.mood,
    })

    const title = transcript.trim() ? memoryTitle(body) : (current.title || 'Voice memory')

    const { data: updated, error: updateErr } = await supabase
      .from('memories')
      .update({
        title,
        body,
        place,
        people: tags.people,
        topics: tags.topics,
        summary: tags.summary,
        memory_type: 'Voice',
        mood: tags.mood,
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryId)
      .eq('user_id', user.id)
      .select(memoryColumns)
      .single()

    if (updateErr || !updated) return null

    revalidatePath('/')
    const memoryObj = await rowToMemoryWithSignedMedia(supabase, updated as MemoryRow, user.id)
    return { ...memoryObj, isProcessing: false, processingStatus: 'completed' }
  } catch (err) {
    console.error('processVoiceMemoryAction error:', err)
    const memoryObj = await rowToMemoryWithSignedMedia(supabase, current as MemoryRow, user.id)
    return { ...memoryObj, isProcessing: false, processingStatus: 'failed' }
  }
}

export async function retryVoiceEnrichmentAction(memoryId: string): Promise<Memory | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Fetch audio media record
  const { data: media } = await supabase
    .from('media')
    .select('storage_path, media_type')
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)
    .eq('media_type', 'audio')
    .maybeSingle()

  if (!media?.storage_path) {
    return retryEnrichmentAction(memoryId)
  }

  // 2. Download audio file
  const { data: audioBlob, error: downloadErr } = await supabase.storage
    .from('memory-audio')
    .download(media.storage_path)

  if (downloadErr || !audioBlob) {
    console.error('Could not download audio for retry:', downloadErr)
    return null
  }

  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64')
  const ext = media.storage_path.split('.').pop()?.toLowerCase() || 'webm'
  const mimeType = ext === 'mp4' ? 'audio/mp4' : ext === 'ogg' ? 'audio/ogg' : ext === 'wav' ? 'audio/wav' : 'audio/webm'

  return processVoiceMemoryAction({
    memoryId,
    audioBase64,
    mimeType,
  })
}

export async function deleteMemory(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: media, error: readError } = await supabase
    .from('media')
    .select('id, storage_path, media_type')
    .eq('memory_id', id)
  if (readError) throw new Error(readError.message)

  const photoPaths = media.filter((m) => m.media_type === 'image').map((item) => item.storage_path)
  const audioPaths = media.filter((m) => m.media_type === 'audio').map((item) => item.storage_path)

  if (photoPaths.length > 0) {
    await supabase.storage.from('memory-photos').remove(photoPaths)
  }
  if (audioPaths.length > 0) {
    await supabase.storage.from('memory-audio').remove(audioPaths)
  }

  if (media.length > 0) {
    const { error } = await supabase.from('media').delete().eq('memory_id', id)
    if (error) throw new Error(error.message)
  }

  const { error } = await supabase
    .from('memories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
}

export interface UpdateMemoryInput {
  id: string
  text: string
  title?: string
  place?: string
  date?: string
  time?: string
  topics?: string[]
}

export async function updateMemoryAction(input: UpdateMemoryInput): Promise<Memory> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const text = input.text.trim()
  if (!text) throw new Error('Memory text cannot be empty')

  const mentionedPeople = extractMentions(text)

  // Fetch current memory
  const { data: current, error: readErr } = await supabase
    .from('memories')
    .select('id, user_id, people, topics, title, place, occurred_on, occurred_time')
    .eq('id', input.id)
    .single()

  if (readErr || !current) throw new Error('Memory not found')

  const existingPeople = (current.people as string[]) || []
  const allPeople = Array.from(new Set([...existingPeople, ...mentionedPeople]))

  const updatePayload: Record<string, any> = {
    body: text,
    people: allPeople,
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) {
    updatePayload.title = input.title.trim() || current.title || memoryTitle(text)
  }
  if (input.place !== undefined) {
    updatePayload.place = input.place.trim()
  }
  if (input.date !== undefined && input.date.trim()) {
    updatePayload.occurred_on = input.date.trim()
  }
  if (input.time !== undefined && input.time.trim()) {
    updatePayload.occurred_time = input.time.trim()
  }
  if (input.topics !== undefined) {
    updatePayload.topics = input.topics
  }

  const { data: updatedRow, error: updateErr } = await supabase
    .from('memories')
    .update(updatePayload)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select(memoryColumns)
    .single()

  if (updateErr) throw new Error(updateErr.message)

  // Auto-invite any newly @mentioned users
  if (mentionedPeople.length > 0) {
    try {
      for (const mentionName of mentionedPeople) {
        const matchingUsers = await searchUsersAction(mentionName)
        const exactMatch = matchingUsers.find(
          (u) =>
            u.displayName.toLowerCase() === mentionName.toLowerCase() ||
            u.email.toLowerCase().startsWith(mentionName.toLowerCase())
        )
        if (exactMatch && exactMatch.id !== user.id) {
          await inviteParticipantsAction(input.id, [exactMatch.id]).catch(() => {})
        }
      }
    } catch {
      // Non-blocking auto-invite
    }
  }

  revalidatePath('/')
  return rowToMemoryWithSignedMedia(supabase, updatedRow as MemoryRow, user.id)
}

export async function deleteMedia(memoryId: string, mediaId: string): Promise<void> {
  const supabase = await createClient()
  const { data: media, error: readError } = await supabase
    .from('media')
    .select('id, storage_path, media_type')
    .eq('id', mediaId)
    .eq('memory_id', memoryId)
    .single()
  if (readError) throw new Error(readError.message)

  const bucket = media.media_type === 'audio' ? 'memory-audio' : 'memory-photos'
  const { error: storageError } = await supabase.storage.from(bucket).remove([media.storage_path])
  if (storageError) throw new Error(storageError.message)

  const { error } = await supabase.from('media').delete().eq('id', media.id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
}

export async function addPhotoToMemoryAction({
  memoryId,
  memoryDate,
  photoBase64,
  fileName,
  fileSize,
  clientTimezone = 'UTC',
}: {
  memoryId: string
  memoryDate: string
  photoBase64: string
  fileName: string
  fileSize: number
  clientTimezone?: string
}): Promise<import('@/types/memory').MediaAsset> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { isSameCalendarDay } = await import('@/lib/format')
  if (!isSameCalendarDay(memoryDate, clientTimezone)) {
    throw new Error('Photos can only be added to memories from today.')
  }

  // Verify memory belongs to user and is not deleted
  const { data: mem, error: memErr } = await supabase
    .from('memories')
    .select('id, user_id, occurred_on')
    .eq('id', memoryId)
    .is('deleted_at', null)
    .single()

  if (memErr || !mem || mem.user_id !== user.id) {
    throw new Error('Memory not found or unauthorized.')
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${user.id}/${Date.now()}-${sanitizedFileName}`
  const buffer = Buffer.from(photoBase64, 'base64')

  const { error: uploadError } = await supabase.storage
    .from('memory-photos')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) {
    throw new Error(`Photo upload failed: ${uploadError.message}`)
  }

  const { data: mediaRow, error: insertError } = await supabase
    .from('media')
    .insert({
      memory_id: memoryId,
      user_id: user.id,
      storage_path: storagePath,
      media_type: 'image',
      file_name: fileName,
      file_size: fileSize || buffer.length,
    })
    .select(mediaColumns)
    .single()

  if (insertError) {
    await supabase.storage.from('memory-photos').remove([storagePath])
    throw new Error(insertError.message || 'Failed to attach photo.')
  }

  const { data: signed } = await supabase.storage.from('memory-photos').createSignedUrl(storagePath, 3600)

  revalidatePath('/')

  return {
    id: mediaRow.id,
    url: signed?.signedUrl || '',
    storagePath: storagePath,
    mediaType: 'image',
    fileName: fileName,
    fileSize: fileSize || buffer.length,
  }
}

export async function getOnboardingStatusAction(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return true

  // Check profiles table
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('has_completed_onboarding')
    .eq('id', user.id)
    .maybeSingle()

  if (!profileErr && profile) {
    return Boolean(profile.has_completed_onboarding)
  }

  // If no profile exists, check if user has existing memories
  const { count } = await supabase
    .from('memories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  const hasMemories = (count ?? 0) > 0

  // Safely insert profile row
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      has_completed_onboarding: hasMemories,
      display_name: user.user_metadata?.full_name || '',
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Ignore insertion errors
  }

  return hasMemories
}


export async function completeOnboardingAction(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      has_completed_onboarding: true,
      updated_at: new Date().toISOString(),
    })

  revalidatePath('/')
}

export async function resetOnboardingAction(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      has_completed_onboarding: false,
      updated_at: new Date().toISOString(),
    })

  revalidatePath('/')
}

// In-memory cache for user search (5 minute TTL)
const userSearchCache = new Map<string, { timestamp: number; results: UserSearchResult[] }>()
const USER_SEARCH_TTL = 5 * 60 * 1000

export async function searchUsersAction(searchQuery: string): Promise<UserSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const query = (searchQuery || '').trim().toLowerCase()
  const cacheKey = `${user.id}:${query}`

  const cached = userSearchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < USER_SEARCH_TTL) {
    return cached.results
  }

  try {
    let results: UserSearchResult[] = []

    if (!query) {
      // Return co-participants from shared memories
      const { data: participantRows } = await supabase
        .from('memory_participants')
        .select('user_id, invited_by')
        .or(`user_id.eq.${user.id},invited_by.eq.${user.id}`)
        .limit(15)

      const relatedIds = new Set<string>()
      for (const row of participantRows || []) {
        if (row.user_id && row.user_id !== user.id) relatedIds.add(row.user_id)
        if (row.invited_by && row.invited_by !== user.id) relatedIds.add(row.invited_by)
      }

      if (relatedIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', Array.from(relatedIds))
          .limit(10)

        if (profiles) {
          results = profiles.map((p) => ({
            id: p.id,
            displayName: p.display_name?.trim() || 'Friend',
            email: '',
          }))
        }
      }
    } else {
      // 1. Try search_users_to_invite RPC first for full name & email matching
      const { data: rpcData, error: rpcErr } = await supabase.rpc('search_users_to_invite', {
        search_query: query,
      })

      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
        results = rpcData.map((r: any) => ({
          id: r.id,
          displayName: r.display_name?.trim() || r.email?.split('@')[0] || 'Thenvue User',
          email: r.email || '',
        }))
      } else {
        // Direct search on profiles table by display_name
        const { data: profiles, error: profileErr } = await supabase
          .from('profiles')
          .select('id, display_name')
          .neq('id', user.id)
          .ilike('display_name', `%${query}%`)
          .limit(10)

        if (!profileErr && profiles && profiles.length > 0) {
          results = profiles.map((p) => ({
            id: p.id,
            displayName: p.display_name?.trim() || 'Thenvue User',
            email: '',
          }))
        }
      }
    }

    userSearchCache.set(cacheKey, { timestamp: Date.now(), results })
    return results
  } catch (err) {
    console.error('searchUsersAction error:', err)
    return []
  }
}

export async function inviteParticipantsAction(
  memoryId: string,
  userIds: string[]
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!userIds || userIds.length === 0) return

  // 1. Verify user is the memory owner
  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .select('id, title, user_id')
    .eq('id', memoryId)
    .is('deleted_at', null)
    .single()

  if (memoryError || !memory || memory.user_id !== user.id) {
    throw new Error('You can only invite people to your own memories.')
  }

  // 2. Fetch inviter's display name
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const inviterName = inviterProfile?.display_name?.trim() || user.email?.split('@')[0] || 'A friend'

  // 3. Filter out self and duplicate user IDs
  const targetUserIds = [...new Set(userIds.filter((id) => id !== user.id))]

  // 4. Insert or update participants
  for (const targetId of targetUserIds) {
    const { error: participantError } = await supabase
      .from('memory_participants')
      .upsert(
        {
          memory_id: memoryId,
          user_id: targetId,
          invited_by: user.id,
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'memory_id,user_id' }
      )

    if (!participantError) {
      // 5. Create notification for the invited user
      await supabase.from('notifications').insert({
        user_id: targetId,
        actor_id: user.id,
        memory_id: memoryId,
        type: 'invitation',
        title: `${inviterName} shared a memory with you`,
        body: memory.title || 'Want to add your side of the story?',
        status: 'unread',
      })
    }
  }

  revalidatePath('/')
}

export async function respondToInvitationAction(
  memoryId: string,
  status: 'accepted' | 'declined'
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('memory_participants')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function addPerspectiveAction({
  memoryId,
  text,
  mediaInputs = [],
  place = '',
  people = [],
  mood = '',
  saveToPersonalMemory = false,
  audioBase64,
  mimeType = 'audio/webm',
}: {
  memoryId: string
  text: string
  mediaInputs?: NewMediaInput[]
  place?: string
  people?: string[]
  mood?: string
  saveToPersonalMemory?: boolean
  audioBase64?: string
  mimeType?: string
}): Promise<MemoryPerspective> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let body = text.trim()

  // If audio is provided, attempt Gemini transcription
  if (audioBase64) {
    try {
      const { transcribeAudio } = await import('@/lib/ai/provider')
      const transcript = await transcribeAudio(audioBase64, mimeType)
      if (transcript && transcript.trim()) {
        body = transcript.trim()
      }
    } catch (err) {
      console.error('Perspective voice transcription fallback:', err)
    }
  }

  if (!body) {
    body = audioBase64 ? `[Voice perspective recorded on ${new Date().toISOString().slice(0, 10)}]` : 'My perspective on this memory'
  }

  // 1. Verify access to memory (owner or participant)
  const { data: memory, error: memoryErr } = await supabase
    .from('memories')
    .select('id, title, user_id, place')
    .eq('id', memoryId)
    .is('deleted_at', null)
    .single()

  if (memoryErr || !memory) throw new Error('Memory not found')

  // Check or update participant status if not owner
  if (memory.user_id !== user.id) {
    const { data: participant } = await supabase
      .from('memory_participants')
      .select('id, status')
      .eq('memory_id', memoryId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!participant || participant.status === 'removed' || participant.status === 'left') {
      throw new Error('You are not a participant in this shared memory.')
    }

    if (participant.status === 'pending') {
      await supabase
        .from('memory_participants')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', participant.id)
    }
  }

  // 2. Validate media
  const validatedMedia = validateMediaInputs(mediaInputs, user.id)

  const effectivePlace = place || memory.place || 'Home'
  const effectivePeople = people
  const effectiveMood = mood || 'calm'

  // 3. Insert memory perspective record immediately (<100ms)
  const { data: perspective, error: perspectiveError } = await supabase
    .from('memory_perspectives')
    .insert({
      memory_id: memoryId,
      user_id: user.id,
      body,
      place: effectivePlace,
      people: effectivePeople,
      topics: ['perspective'],
      mood: effectiveMood,
      summary: '',
      memory_type: 'Perspective',
      saved_to_personal_memory: saveToPersonalMemory,
      embedding: null,
    })
    .select()
    .single()

  if (perspectiveError) throw new Error(perspectiveError.message)

  // 4. Insert perspective media records
  if (validatedMedia.length > 0) {
    const { error: mediaErr } = await supabase.from('media').insert(
      validatedMedia.map((m) => ({
        memory_id: memoryId,
        perspective_id: perspective.id,
        user_id: user.id,
        storage_path: m.storagePath,
        media_type: m.mediaType,
        file_name: m.fileName,
        file_size: m.fileSize,
      }))
    )
    if (mediaErr) console.error('Error inserting perspective media:', mediaErr)
  }

  // 5. Handle "Save to My Memories"
  let personalMemoryId: string | null = null
  if (saveToPersonalMemory) {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', memory.user_id)
      .maybeSingle()

    const ownerName = ownerProfile?.display_name?.trim() || 'a friend'
    const captureTime = currentCaptureTime()

    const { data: personalMem, error: personalMemErr } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        title: memory.title,
        body,
        occurred_at: new Date().toISOString(),
        occurred_on: captureTime.date,
        occurred_time: captureTime.time,
        place: effectivePlace,
        people: effectivePeople,
        topics: ['perspective'],
        summary: '',
        memory_type: 'Perspective',
        mood: effectiveMood,
        source_memory_id: memoryId,
        shared_context: `From a shared memory with ${ownerName}`,
        embedding: null,
      })
      .select('id')
      .single()

    if (!personalMemErr && personalMem) {
      personalMemoryId = personalMem.id
      await supabase
        .from('memory_perspectives')
        .update({ personal_memory_id: personalMem.id })
        .eq('id', perspective.id)

      if (validatedMedia.length > 0) {
        await supabase.from('media').insert(
          validatedMedia.map((m) => ({
            memory_id: personalMem.id,
            user_id: user.id,
            storage_path: m.storagePath,
            media_type: m.mediaType,
            file_name: m.fileName,
            file_size: m.fileSize,
          }))
        )
      }
    }
  }

  // 6. Background AI tagging and embeddings (non-blocking)
  ;(async () => {
    try {
      const tags = await tagMemory(body)
      const aiPlace = place || tags.places[0] || effectivePlace
      const aiPeople = people.length > 0 ? people : tags.people
      const aiMood = mood || tags.mood

      const embedding = await embedMemorySafe({
        text: body,
        summary: tags.summary,
        people: aiPeople,
        place: aiPlace,
        topics: tags.topics,
        memoryType: tags.memoryType || 'Perspective',
        mood: aiMood,
      })

      await supabase
        .from('memory_perspectives')
        .update({
          place: aiPlace,
          people: aiPeople,
          topics: tags.topics,
          mood: aiMood,
          summary: tags.summary,
          embedding,
          updated_at: new Date().toISOString(),
        })
        .eq('id', perspective.id)

      if (personalMemoryId) {
        await supabase
          .from('memories')
          .update({
            place: aiPlace,
            people: aiPeople,
            topics: tags.topics,
            mood: aiMood,
            summary: tags.summary,
            embedding,
            updated_at: new Date().toISOString(),
          })
          .eq('id', personalMemoryId)
      }
    } catch (err) {
      console.error('Background perspective enrichment error:', err)
    }
  })()

  // 7. Dispatch notification to memory owner (if not self)
  if (memory.user_id !== user.id) {
    const { data: contributorProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()

    const contributorName = contributorProfile?.display_name?.trim() || user.email?.split('@')[0] || 'Someone'

    await supabase.from('notifications').insert({
      user_id: memory.user_id,
      actor_id: user.id,
      memory_id: memoryId,
      perspective_id: perspective.id,
      type: 'perspective_added',
      title: `${contributorName} added their perspective`,
      body: memory.title || 'A new perspective was added to your memory.',
      status: 'unread',
    })
  }

  revalidatePath('/')

  // 8. Fetch user display name and format returned perspective
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const authorName = userProfile?.display_name?.trim() || user.email?.split('@')[0] || 'You'

  // Resolve media URLs
  const { signedMediaUrls } = await import('@/lib/memories')
  const { data: mediaRows } = await supabase
    .from('media')
    .select(mediaColumns)
    .eq('perspective_id', perspective.id)

  const signedUrls = await signedMediaUrls(supabase, (mediaRows || []) as MediaRow[])

  return {
    id: perspective.id,
    memoryId: perspective.memory_id,
    userId: perspective.user_id,
    authorName,
    text: perspective.body,
    place: perspective.place,
    people: perspective.people || [],
    topics: perspective.topics || [],
    mood: perspective.mood,
    summary: perspective.summary,
    memoryType: perspective.memory_type,
    savedToPersonalMemory: perspective.saved_to_personal_memory,
    personalMemoryId,
    createdAt: perspective.created_at,
    updatedAt: perspective.updated_at,
    isAuthor: true,
    media: ((mediaRows || []) as MediaRow[]).flatMap((m) => {
      const url = signedUrls.get(m.storage_path)
      return url
        ? [
            {
              id: m.id,
              storagePath: m.storage_path,
              mediaType: m.media_type,
              fileName: m.file_name,
              fileSize: m.file_size,
              perspectiveId: m.perspective_id,
              url,
            },
          ]
        : []
    }),
  }
}

export async function getPerspectivesPageAction({
  memoryId,
  limit = 10,
  cursor,
}: {
  memoryId: string
  limit?: number
  cursor?: string
}): Promise<{ perspectives: MemoryPerspective[]; nextCursor: string | null; hasMore: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { perspectives: [], nextCursor: null, hasMore: false }

  const safeLimit = Math.min(Math.max(limit, 1), 50)

  let query = supabase
    .from('memory_perspectives')
    .select('id, memory_id, user_id, body, place, people, topics, mood, summary, memory_type, saved_to_personal_memory, personal_memory_id, created_at, updated_at')
    .eq('memory_id', memoryId)
    .order('created_at', { ascending: true })

  if (cursor) {
    query = query.gt('created_at', cursor)
  }

  query = query.limit(safeLimit + 1)

  const { data: rows, error } = await query
  if (error || !rows) return { perspectives: [], nextCursor: null, hasMore: false }

  const hasMore = rows.length > safeLimit
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows

  // Batch fetch author names
  const authorIds = [...new Set(pageRows.map((p) => p.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)

  const profileMap = new Map<string, string>()
  for (const p of profiles || []) {
    profileMap.set(p.id, p.display_name || 'Friend')
  }

  // Batch fetch media
  const perspectiveIds = pageRows.map((p) => p.id)
  const { data: mediaRows } = await supabase
    .from('media')
    .select(mediaColumns)
    .in('perspective_id', perspectiveIds)

  const { signedMediaUrls } = await import('@/lib/memories')
  const signedUrls = await signedMediaUrls(supabase, (mediaRows || []) as MediaRow[])

  const perspectives: MemoryPerspective[] = pageRows.map((p) => {
    const pMedia = ((mediaRows || []) as MediaRow[])
      .filter((m) => m.perspective_id === p.id)
      .flatMap((m) => {
        const url = signedUrls.get(m.storage_path)
        return url
          ? [
              {
                id: m.id,
                storagePath: m.storage_path,
                mediaType: m.media_type,
                fileName: m.file_name,
                fileSize: m.file_size,
                perspectiveId: m.perspective_id,
                url,
              },
            ]
          : []
      })

    return {
      id: p.id,
      memoryId: p.memory_id,
      userId: p.user_id,
      authorName: p.user_id === user.id ? 'You' : profileMap.get(p.user_id) || 'Friend',
      text: p.body,
      place: p.place,
      people: p.people || [],
      topics: p.topics || [],
      mood: p.mood,
      summary: p.summary,
      memoryType: p.memory_type,
      savedToPersonalMemory: p.saved_to_personal_memory,
      personalMemoryId: p.personal_memory_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      isAuthor: p.user_id === user.id,
      media: pMedia,
    }
  })

  const nextCursor = hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1].created_at : null

  return {
    perspectives,
    nextCursor,
    hasMore,
  }
}

export async function deletePerspectiveAction(perspectiveId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Fetch perspective and memory
  const { data: perspective, error } = await supabase
    .from('memory_perspectives')
    .select('id, user_id, memory_id, personal_memory_id')
    .eq('id', perspectiveId)
    .single()

  if (error || !perspective) throw new Error('Perspective not found')

  const { data: memory } = await supabase
    .from('memories')
    .select('user_id')
    .eq('id', perspective.memory_id)
    .single()

  const isAuthor = perspective.user_id === user.id
  const isMemoryOwner = memory?.user_id === user.id

  if (!isAuthor && !isMemoryOwner) {
    throw new Error('Unauthorized to delete this perspective.')
  }

  // Remove media files
  const { data: mediaList } = await supabase
    .from('media')
    .select('storage_path, media_type')
    .eq('perspective_id', perspectiveId)

  if (mediaList && mediaList.length > 0) {
    const photos = mediaList.filter((m) => m.media_type === 'image' || m.media_type === 'document').map((m) => m.storage_path)
    const audio = mediaList.filter((m) => m.media_type === 'audio').map((m) => m.storage_path)
    if (photos.length > 0) await supabase.storage.from('memory-photos').remove(photos)
    if (audio.length > 0) await supabase.storage.from('memory-audio').remove(audio)
    await supabase.from('media').delete().eq('perspective_id', perspectiveId)
  }

  // Delete perspective
  await supabase.from('memory_perspectives').delete().eq('id', perspectiveId)

  // If author deleted perspective and there was a personal copy, soft-delete or retain it
  if (perspective.personal_memory_id && isAuthor) {
    await supabase.from('memories').delete().eq('id', perspective.personal_memory_id)
  }

  revalidatePath('/')
}

export async function leaveSharedMemoryAction(memoryId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('memory_participants')
    .update({ status: 'left', updated_at: new Date().toISOString() })
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)

  revalidatePath('/')
}

export async function removeParticipantAction(memoryId: string, targetUserId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify memory ownership
  const { data: memory } = await supabase
    .from('memories')
    .select('user_id')
    .eq('id', memoryId)
    .single()

  if (memory?.user_id !== user.id) {
    throw new Error('Only the memory owner can remove participants.')
  }

  await supabase
    .from('memory_participants')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('memory_id', memoryId)
    .eq('user_id', targetUserId)

  revalidatePath('/')
}

export async function stopSharingMemoryAction(memoryId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify memory ownership
  const { data: memory } = await supabase
    .from('memories')
    .select('user_id')
    .eq('id', memoryId)
    .single()

  if (memory?.user_id !== user.id) {
    throw new Error('Only the memory owner can stop sharing.')
  }

  await supabase.from('memory_participants').delete().eq('memory_id', memoryId)
  await supabase.from('notifications').delete().eq('memory_id', memoryId)

  revalidatePath('/')
}

export async function getMemoryDetailsAction(memoryId: string): Promise<Memory | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Fetch memory
  const { data: mem, error: memErr } = await supabase
    .from('memories')
    .select(memoryColumns)
    .eq('id', memoryId)
    .is('deleted_at', null)
    .maybeSingle()

  if (memErr || !mem) return null

  const isOwner = mem.user_id === user.id

  // 2. Fetch participants with display names
  const { data: participantRows } = await supabase
    .from('memory_participants')
    .select('id, memory_id, user_id, invited_by, status, created_at, updated_at')
    .eq('memory_id', memoryId)

  const participantUserIds = (participantRows || []).map((p) => p.user_id)
  let profileMap = new Map<string, string>()

  if (participantUserIds.length > 0 || mem.user_id) {
    const allUserIds = [...new Set([...participantUserIds, mem.user_id])]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', allUserIds)

    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, p.display_name || 'Friend')
      }
    }
  }

  const participants: MemoryParticipant[] = (participantRows || []).map((p) => ({
    id: p.id,
    memoryId: p.memory_id,
    userId: p.user_id,
    invitedBy: p.invited_by,
    displayName: profileMap.get(p.user_id) || 'Friend',
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }))

  // 3. Fetch perspectives with media
  const { data: perspectiveRows } = await supabase
    .from('memory_perspectives')
    .select('id, memory_id, user_id, body, place, people, topics, mood, summary, memory_type, saved_to_personal_memory, personal_memory_id, created_at, updated_at')
    .eq('memory_id', memoryId)
    .order('created_at', { ascending: true })

  // 4. Fetch media for memory and perspectives
  const { data: mediaRows } = await supabase
    .from('media')
    .select(mediaColumns)
    .eq('memory_id', memoryId)

  const { signedMediaUrls } = await import('@/lib/memories')
  const signedUrls = await signedMediaUrls(supabase, (mediaRows || []) as MediaRow[])

  // Separate media into primary memory vs perspectives
  const memoryMedia = ((mediaRows || []) as MediaRow[])
    .filter((m) => !m.perspective_id)
    .flatMap((m) => {
      const url = signedUrls.get(m.storage_path)
      return url
        ? [
            {
              id: m.id,
              storagePath: m.storage_path,
              mediaType: m.media_type,
              fileName: m.file_name,
              fileSize: m.file_size,
              perspectiveId: m.perspective_id,
              url,
            },
          ]
        : []
    })

  const perspectives: MemoryPerspective[] = ((perspectiveRows || []) as any[]).map((p) => {
    const pMedia = ((mediaRows || []) as MediaRow[])
      .filter((m) => m.perspective_id === p.id)
      .flatMap((m) => {
        const url = signedUrls.get(m.storage_path)
        return url
          ? [
              {
                id: m.id,
                storagePath: m.storage_path,
                mediaType: m.media_type,
                fileName: m.file_name,
                fileSize: m.file_size,
                perspectiveId: m.perspective_id,
                url,
              },
            ]
          : []
      })

    return {
      id: p.id,
      memoryId: p.memory_id,
      userId: p.user_id,
      authorName: p.user_id === user.id ? 'You' : profileMap.get(p.user_id) || 'Friend',
      text: p.body,
      place: p.place,
      people: p.people || [],
      topics: p.topics || [],
      mood: p.mood,
      summary: p.summary,
      memoryType: p.memory_type,
      savedToPersonalMemory: p.saved_to_personal_memory,
      personalMemoryId: p.personal_memory_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      isAuthor: p.user_id === user.id,
      media: pMedia,
    }
  })

  const memory = rowToMemory(mem as MemoryRow, signedUrls, user.id)
  memory.media = memoryMedia
  memory.participants = participants
  memory.perspectives = perspectives
  memory.isOwner = isOwner

  return memory
}

export async function getNotificationsAction(): Promise<MemoryNotification[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, memory_id, perspective_id, type, title, body, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error || !rows) return []

  const actorIds = [...new Set(rows.map((r) => r.actor_id))]
  let actorMap = new Map<string, string>()

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', actorIds)

    if (profiles) {
      for (const p of profiles) {
        actorMap.set(p.id, p.display_name || 'A friend')
      }
    }
  }

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    actorId: r.actor_id,
    actorName: actorMap.get(r.actor_id) || 'A friend',
    memoryId: r.memory_id,
    memoryTitle: r.body,
    perspectiveId: r.perspective_id,
    type: r.type,
    title: r.title,
    body: r.body,
    status: r.status,
    createdAt: r.created_at,
  }))
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/')
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('user_id', user.id)

  revalidatePath('/')
}

// ==========================================================================
// Phase 10: Rediscover Your Past / Past Photo Import Services
// ==========================================================================

export async function getPastImportQuotaAction(): Promise<PastImportQuota> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { used: 0, limit: 100, remaining: 100 }

  const { data, error } = await supabase.rpc('get_user_past_import_quota', {
    p_user_id: user.id,
  })

  if (!error && data) {
    return {
      used: Number(data.used || 0),
      limit: Number(data.limit || 100),
      remaining: Number(data.remaining || 100),
    }
  }

  // Fallback: direct table count of active past_import media
  const { count } = await supabase
    .from('media')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('source_type', 'past_import')

  const used = count || 0
  return {
    used,
    limit: 100,
    remaining: Math.max(0, 100 - used),
  }
}

export async function createImportJobAction(totalAssets: number): Promise<{ jobId: string; remainingQuota: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (totalAssets <= 0) throw new Error('No photos selected for import.')

  // 1. Strict Server-Side Quota Enforcement
  const quota = await getPastImportQuotaAction()
  if (totalAssets > quota.remaining) {
    throw new Error(`You have ${quota.remaining} past photo slot${quota.remaining === 1 ? '' : 's'} remaining (max 100). Please select up to ${quota.remaining} photos.`)
  }

  // 2. Create Job Record
  const { data: job, error } = await supabase
    .from('memory_import_jobs')
    .insert({
      user_id: user.id,
      status: 'processing',
      total_assets: totalAssets,
      processed_assets: 0,
      created_memories: 0,
      failed_assets: 0,
    })
    .select('id')
    .single()

  if (error || !job) {
    // If table doesn't exist yet, return a virtual job ID
    return { jobId: crypto.randomUUID(), remainingQuota: quota.remaining }
  }

  return { jobId: job.id, remainingQuota: quota.remaining }
}

export type RawPastPhotoInput = {
  storagePath?: string
  base64?: string
  fileName: string
  fileSize: number
  mimeType?: string
  capturedAt?: string | null
  capturedDate?: string | null
  capturedTime?: string | null
  dateSource?: string | null
  dateStatus?: 'exact' | 'inferred' | 'unknown'
  nativeCreationDate?: string | null
  latitude?: number | null
  longitude?: number | null
  hash?: string
}

export async function uploadAndProcessPastPhotosAction({
  jobId,
  photos,
}: {
  jobId: string
  photos: RawPastPhotoInput[]
}): Promise<{
  candidates: MemoryClusterCandidate[]
  duplicateCount: number
  failedCount: number
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (photos.length === 0) throw new Error('No photos provided.')

  // 1. Server quota check
  const quota = await getPastImportQuotaAction()
  if (photos.length > quota.remaining) {
    throw new Error(`Cannot import ${photos.length} photos. You have ${quota.remaining} past photo slots remaining.`)
  }

  // 2. Detect duplicates
  const seenHashes = new Set<string>()
  const validPhotos: (RawPastPhotoInput & { computedHash: string; buffer?: Buffer })[] = []
  let duplicateCount = 0
  let failedCount = 0

  for (const photo of photos) {
    try {
      let computedHash = photo.hash || ''
      let buffer: Buffer | undefined = undefined

      if (photo.base64) {
        buffer = Buffer.from(photo.base64, 'base64')
        computedHash = createHash('sha256').update(buffer).digest('hex')
      } else if (!computedHash && photo.storagePath) {
        computedHash = createHash('sha256').update(`${photo.storagePath}-${photo.fileSize}`).digest('hex')
      }

      if (computedHash && seenHashes.has(computedHash)) {
        duplicateCount++
        continue
      }
      if (computedHash) seenHashes.add(computedHash)
      validPhotos.push({ ...photo, computedHash, buffer })
    } catch {
      failedCount++
    }
  }

  if (validPhotos.length === 0) {
    return { candidates: [], duplicateCount, failedCount }
  }

  // 3. Process uploads & metadata (Direct client uploads or parallel server uploads)
  const { extractPhotoMetadata, logPhotoDateExtraction } = await import('@/lib/photo-date-extractor')
  const uploadedAssets: ImportedAsset[] = []
  const storagePathsForSigning: string[] = []

  // Batch upload any photos that have raw buffers (concurrency limit 5)
  const UPLOAD_CONCURRENCY = 5
  for (let i = 0; i < validPhotos.length; i += UPLOAD_CONCURRENCY) {
    const chunk = validPhotos.slice(i, i + UPLOAD_CONCURRENCY)
    await Promise.all(
      chunk.map(async (photo) => {
        try {
          const ext = photo.fileName.split('.').pop()?.toLowerCase() || 'jpg'
          let storagePath = photo.storagePath
          const contentType = photo.mimeType || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg')

          if (!storagePath && photo.buffer) {
            storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
            const { error: uploadErr } = await supabase.storage
              .from('memory-photos')
              .upload(storagePath, photo.buffer, { contentType, upsert: false })

            if (uploadErr) {
              failedCount++
              return
            }
          }

          if (!storagePath) {
            failedCount++
            return
          }

          // Metadata extraction
          let extracted = {
            capturedAt: photo.capturedAt || null,
            capturedDate: photo.capturedDate || null,
            capturedTime: photo.capturedTime || null,
            dateSource: photo.dateSource || 'unknown',
            dateStatus: photo.dateStatus || 'unknown',
            importedAt: new Date().toISOString(),
            latitude: photo.latitude ?? null,
            longitude: photo.longitude ?? null,
          }

          if (photo.buffer) {
            const serverExtracted = extractPhotoMetadata({
              buffer: photo.buffer,
              fileName: photo.fileName,
              nativeCreationDate: photo.nativeCreationDate,
            })
            extracted = {
              capturedAt: serverExtracted.capturedAt || photo.capturedAt || null,
              capturedDate: serverExtracted.capturedDate || photo.capturedDate || null,
              capturedTime: serverExtracted.capturedTime || photo.capturedTime || null,
              dateSource: serverExtracted.dateSource || photo.dateSource || 'unknown',
              dateStatus: serverExtracted.dateStatus || photo.dateStatus || 'unknown',
              importedAt: serverExtracted.importedAt,
              latitude: serverExtracted.latitude ?? photo.latitude ?? null,
              longitude: serverExtracted.longitude ?? photo.longitude ?? null,
            }
          }

          const assetId = crypto.randomUUID()
          storagePathsForSigning.push(storagePath)

          // Insert into imported_assets
          await supabase.from('imported_assets').insert({
            id: assetId,
            user_id: user.id,
            import_job_id: jobId,
            storage_path: storagePath,
            source_type: 'past_import',
            captured_at: extracted.capturedAt,
            latitude: extracted.latitude,
            longitude: extracted.longitude,
            mime_type: contentType,
            file_size: photo.fileSize,
            content_hash: photo.computedHash,
            processing_status: 'processed',
          })

          uploadedAssets.push({
            id: assetId,
            userId: user.id,
            importJobId: jobId,
            storagePath,
            sourceType: 'past_import',
            capturedAt: extracted.capturedAt,
            capturedDate: extracted.capturedDate,
            capturedTime: extracted.capturedTime,
            dateSource: extracted.dateSource,
            dateStatus: extracted.dateStatus as any,
            importedAt: extracted.importedAt,
            latitude: extracted.latitude,
            longitude: extracted.longitude,
            mimeType: contentType,
            fileSize: photo.fileSize,
            contentHash: photo.computedHash,
            processingStatus: 'processed',
            createdAt: new Date().toISOString(),
          })
        } catch {
          failedCount++
        }
      })
    )
  }

  // P4: Batch signed URL creation in 1 single roundtrip
  const signedUrlMap = new Map<string, string>()
  if (storagePathsForSigning.length > 0) {
    try {
      const { data: signedUrls } = await supabase.storage
        .from('memory-photos')
        .createSignedUrls(storagePathsForSigning, 3600)

      if (signedUrls) {
        for (const item of signedUrls) {
          if (item.signedUrl && item.path) {
            signedUrlMap.set(item.path, item.signedUrl)
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  for (const asset of uploadedAssets) {
    asset.url = signedUrlMap.get(asset.storagePath) || ''
  }

  // 4. Deterministic Clustering by captured date and time proximity
  uploadedAssets.sort((a, b) => {
    if (a.capturedDate && b.capturedDate) {
      const dateCmp = a.capturedDate.localeCompare(b.capturedDate)
      if (dateCmp !== 0) return dateCmp
      const timeA = a.capturedAt ? new Date(a.capturedAt).getTime() : 0
      const timeB = b.capturedAt ? new Date(b.capturedAt).getTime() : 0
      return timeA - timeB
    }
    if (a.capturedDate) return -1
    if (b.capturedDate) return 1
    return 0
  })

  const rawClusters: ImportedAsset[][] = []
  let currentCluster: ImportedAsset[] = []

  for (let i = 0; i < uploadedAssets.length; i++) {
    const asset = uploadedAssets[i]
    if (currentCluster.length === 0) {
      currentCluster.push(asset)
      continue
    }

    const prevAsset = currentCluster[currentCluster.length - 1]
    const hasTimestamps = Boolean(asset.capturedAt && prevAsset.capturedAt)
    const timeDiffHours = hasTimestamps
      ? Math.abs(new Date(asset.capturedAt!).getTime() - new Date(prevAsset.capturedAt!).getTime()) / (1000 * 60 * 60)
      : null

    const sameDate = Boolean(asset.capturedDate && prevAsset.capturedDate && asset.capturedDate === prevAsset.capturedDate)
    const bothUnknown = !asset.capturedDate && !prevAsset.capturedDate
    const nearbyAcrossMidnight = timeDiffHours !== null && timeDiffHours <= 4

    if (((sameDate && (timeDiffHours === null || timeDiffHours <= 4)) || nearbyAcrossMidnight) && currentCluster.length < 10) {
      currentCluster.push(asset)
    } else if (bothUnknown && currentCluster.length < 8) {
      currentCluster.push(asset)
    } else {
      rawClusters.push(currentCluster)
      currentCluster = [asset]
    }
  }
  if (currentCluster.length > 0) {
    rawClusters.push(currentCluster)
  }

  // P1: Parallel Gemini Cluster Understanding with Concurrency Limit 3
  const candidates: MemoryClusterCandidate[] = []
  const CLUSTER_CONCURRENCY = 3

  for (let i = 0; i < rawClusters.length; i += CLUSTER_CONCURRENCY) {
    const clusterChunk = rawClusters.slice(i, i + CLUSTER_CONCURRENCY)
    const chunkCandidates = await Promise.all(
      clusterChunk.map(async (clusterAssets) => {
        const clusterId = crypto.randomUUID()
        const firstAssetWithDate = clusterAssets.find((a) => a.capturedDate) || clusterAssets[0]
        const clusterDate = firstAssetWithDate?.capturedDate || null
        const clusterTime = firstAssetWithDate?.capturedTime || null
        const clusterDateStatus = clusterAssets.some((a) => a.dateStatus === 'exact')
          ? 'exact'
          : clusterAssets.some((a) => a.dateStatus === 'inferred')
          ? 'inferred'
          : 'unknown'
        const clusterDateSource = firstAssetWithDate?.dateSource || 'unknown'

        let inferredTitle = clusterAssets.length === 1 ? 'Past Moment' : `${clusterAssets.length} Photos Moment`
        let inferredSummary = `Imported past moment with ${clusterAssets.length} photo${clusterAssets.length === 1 ? '' : 's'}.`
        let inferredPlace = ''
        let inferredPeople: string[] = []
        let inferredTopics = ['past photos', 'rediscover']
        let inferredMood = 'reflective'

        try {
          const { generateStructured } = await import('@/lib/ai/provider')
          const clusterPrompt = `A user is rediscovering past photos in Thenvue.
Cluster size: ${clusterAssets.length} photos.
Known capture date: ${clusterDate || 'Unknown date (user will set date)'}.
Coordinates available: ${firstAssetWithDate?.latitude ? `${firstAssetWithDate.latitude}, ${firstAssetWithDate.longitude}` : 'None'}.

Generate structured memory understanding for this past moment:
- A warm, evocative title (e.g. "Afternoon by the Coast", "Family Gathering 2022", "Trip to the Mountains")
- A reflective 1-2 sentence summary
- Location if inferrable (otherwise leave empty)
- Topics (2-4 keywords)
- Mood (one of joyful, peaceful, reflective, nostalgic, energetic, calm)`

          const schema = {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              summary: { type: 'STRING' },
              location: { type: 'STRING' },
              topics: { type: 'ARRAY', items: { type: 'STRING' } },
              mood: { type: 'STRING' },
            },
            required: ['title', 'summary'],
          }

          const aiResult: any = await generateStructured(clusterPrompt, schema)
          if (aiResult?.title) inferredTitle = aiResult.title
          if (aiResult?.summary) inferredSummary = aiResult.summary
          if (aiResult?.location) inferredPlace = aiResult.location
          if (aiResult?.topics && Array.isArray(aiResult.topics)) inferredTopics = aiResult.topics
          if (aiResult?.mood) inferredMood = aiResult.mood
        } catch {
          // Fallback if AI is offline
        }

        // Save cluster record
        await supabase.from('memory_clusters').insert({
          id: clusterId,
          user_id: user.id,
          import_job_id: jobId,
          title: inferredTitle,
          summary: inferredSummary,
          suggested_date: clusterDate,
          location_name: inferredPlace,
          latitude: firstAssetWithDate?.latitude || null,
          longitude: firstAssetWithDate?.longitude || null,
          people: inferredPeople,
          topics: inferredTopics,
          mood: inferredMood,
          photo_count: clusterAssets.length,
          confidence: 0.9,
          status: 'pending',
        })

        logPhotoDateExtraction({
          fileName: `${clusterAssets.length} photos in cluster`,
          extractedCapturedAt: firstAssetWithDate?.capturedAt,
          importedAt: firstAssetWithDate?.importedAt,
          finalClusterDate: clusterDate,
          finalMemoryDate: clusterDate,
          dateSource: clusterDateSource,
          dateStatus: clusterDateStatus,
        })

        return {
          id: clusterId,
          userId: user.id,
          importJobId: jobId,
          title: inferredTitle,
          summary: inferredSummary,
          suggestedDate: clusterDate,
          suggestedTime: clusterTime,
          dateSource: clusterDateSource,
          dateStatus: clusterDateStatus as any,
          locationName: inferredPlace,
          latitude: firstAssetWithDate?.latitude || null,
          longitude: firstAssetWithDate?.longitude || null,
          people: inferredPeople,
          topics: inferredTopics,
          mood: inferredMood,
          photoCount: clusterAssets.length,
          confidence: 0.9,
          status: 'pending' as const,
          assets: clusterAssets,
          createdAt: new Date().toISOString(),
        }
      })
    )
    candidates.push(...chunkCandidates)
  }

  // Update import job status to review
  await supabase
    .from('memory_import_jobs')
    .update({
      status: 'review',
      processed_assets: validPhotos.length - failedCount,
      failed_assets: failedCount,
    })
    .eq('id', jobId)

  return { candidates, duplicateCount, failedCount }
}

export async function saveRediscoveredMemoryAction({
  clusterId,
  title,
  story,
  date,
  time,
  place = '',
  people = [],
  topics = [],
  mood = 'reflective',
  assetIds = [],
  storagePaths = [],
}: {
  clusterId?: string
  title: string
  story?: string
  date: string
  time?: string
  place?: string
  people?: string[]
  topics?: string[]
  mood?: string
  assetIds?: string[]
  storagePaths: string[]
}): Promise<Memory> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Date validation
  const cleanDate = date?.trim()
  if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error('A valid capture date (YYYY-MM-DD) is required to save this rediscovered memory. Please select a date.')
  }

  const rawTime = (time || '12:00:00').trim()
  const cleanTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime.length === 8 ? rawTime : '12:00:00'

  const effectiveTitle = title.trim() || 'Rediscovered Memory'
  const effectiveBody = story?.trim() || `Rediscovered memory from ${cleanDate} with ${storagePaths.length} photo${storagePaths.length === 1 ? '' : 's'}.`
  const finalTopics = topics.length > 0 ? topics : ['past photos', 'rediscover']
  const finalPeople = people
  const finalPlace = place.trim()
  const finalMood = mood || 'reflective'

  // P2: Save Core Memory Record Immediately (<100ms) with processing_status = 'processing'
  const occurredAtIso = `${cleanDate}T${cleanTime}.000Z`

  const { data: memoryData, error: memError } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title: effectiveTitle,
      body: effectiveBody,
      occurred_at: occurredAtIso,
      occurred_on: cleanDate,
      occurred_time: cleanTime,
      place: finalPlace,
      people: finalPeople,
      topics: finalTopics,
      summary: effectiveBody.slice(0, 120),
      memory_type: 'moment',
      mood: finalMood,
      processing_status: 'processing',
    })
    .select('id, user_id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood, created_at, processing_status')
    .single()

  if (memError || !memoryData) throw new Error(memError?.message || 'Could not save rediscovered memory.')

  // Attach media in parallel
  const mediaRows: MediaRow[] = []
  if (storagePaths.length > 0) {
    const insertedMedia = await Promise.all(
      storagePaths.map(async (path) => {
        const fileName = path.split('/').pop() || 'photo.jpg'
        const { data: mRow } = await supabase
          .from('media')
          .insert({
            memory_id: memoryData.id,
            user_id: user.id,
            storage_path: path,
            media_type: 'image',
            file_name: fileName,
            file_size: 150000,
            source_type: 'past_import',
          })
          .select('id, memory_id, user_id, storage_path, media_type, file_name, file_size, created_at, source_type')
          .single()

        if (mRow) {
          await supabase
            .from('imported_assets')
            .update({ memory_id: memoryData.id, media_id: mRow.id })
            .eq('storage_path', path)
            .eq('user_id', user.id)
        }
        return mRow
      })
    )
    for (const m of insertedMedia) {
      if (m) mediaRows.push(m as any)
    }
  }

  // Mark cluster approved
  if (clusterId) {
    await supabase
      .from('memory_clusters')
      .update({ status: 'approved' })
      .eq('id', clusterId)
  }

  revalidatePath('/')

  const initialMemory = await rowToMemoryWithSignedMedia(supabase, {
    ...memoryData,
    media: mediaRows,
  } as any, user.id)

  // Attach isProcessing and processingStatus for instant UI response
  initialMemory.isProcessing = true
  initialMemory.processingStatus = 'processing'

  return initialMemory
}

export async function deleteImportedAssetAction(storagePath: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete from storage
  await supabase.storage.from('memory-photos').remove([storagePath])

  // Delete from imported_assets
  await supabase
    .from('imported_assets')
    .delete()
    .eq('storage_path', storagePath)
    .eq('user_id', user.id)

  // Delete from media
  await supabase
    .from('media')
    .delete()
    .eq('storage_path', storagePath)
    .eq('user_id', user.id)

  revalidatePath('/')
}

export async function getRediscoveredMemoriesAction(): Promise<Memory[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Query memories that have media with source_type = 'past_import'
  const { data: mediaItems } = await supabase
    .from('media')
    .select('memory_id')
    .eq('user_id', user.id)
    .eq('source_type', 'past_import')

  if (!mediaItems || mediaItems.length === 0) return []

  const memoryIds = Array.from(new Set(mediaItems.map((m) => m.memory_id).filter(Boolean)))
  if (memoryIds.length === 0) return []

  const { data: memoriesData } = await supabase
    .from('memories')
    .select(memoryColumns)
    .in('id', memoryIds)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })

  if (!memoriesData) return []
  return rowsToMemories(supabase, memoriesData as MemoryRow[], user.id)
}

export interface PublicSharedMemory {
  id: string
  title: string
  body: string
  date: string
  time: string
  place: string
  people: string[]
  topics: string[]
  summary?: string
  authorName: string
  photos: string[]
  perspectivesCount: number
}

export async function getSharedMemoryPublicAction(memoryId: string): Promise<PublicSharedMemory | null> {
  const supabase = await createClient()

  // 1. Fetch memory record
  const { data: mem, error: memErr } = await supabase
    .from('memories')
    .select('id, user_id, title, body, occurred_on, occurred_time, place, people, topics, summary')
    .eq('id', memoryId)
    .is('deleted_at', null)
    .maybeSingle()

  if (memErr || !mem) return null

  // 2. Fetch author profile
  let authorName = 'A friend'
  if (mem.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', mem.user_id)
      .maybeSingle()
    if (profile?.display_name?.trim()) {
      authorName = profile.display_name.trim()
    }
  }

  // 3. Fetch media photos
  const { data: mediaRows } = await supabase
    .from('media')
    .select('storage_path, media_type')
    .eq('memory_id', memoryId)
    .eq('media_type', 'image')

  const photos: string[] = []
  if (mediaRows && mediaRows.length > 0) {
    const paths = mediaRows.map((m) => m.storage_path)
    const { data: signedData } = await supabase.storage
      .from('memory-photos')
      .createSignedUrls(paths, 60 * 60 * 24)

    for (const item of signedData || []) {
      if (item.signedUrl) photos.push(item.signedUrl)
    }
  }

  // 4. Count perspectives
  const { count: perspectivesCount } = await supabase
    .from('memory_perspectives')
    .select('id', { count: 'exact', head: true })
    .eq('memory_id', memoryId)

  return {
    id: mem.id,
    title: mem.title || 'Shared Moment',
    body: mem.body || '',
    date: mem.occurred_on,
    time: mem.occurred_time,
    place: mem.place || 'Somewhere special',
    people: mem.people || [],
    topics: mem.topics || [],
    summary: mem.summary || '',
    authorName,
    photos,
    perspectivesCount: perspectivesCount || 0,
  }
}




