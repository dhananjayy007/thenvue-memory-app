import type { SupabaseClient } from '@supabase/supabase-js'
import type { MediaAsset, Memory, MemoryCaptureTime, NewMediaInput } from '@/types/memory'

export const MAX_MEDIA_PER_MEMORY = 5
export const MAX_MEDIA_BYTES = 12 * 1024 * 1024
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024
export const MAX_MEMORY_CHARS = 10_000

export type MediaRow = {
  id: string
  memory_id: string
  user_id: string
  storage_path: string
  media_type: 'image' | 'audio' | 'document'
  file_name: string
  file_size: number
  created_at: string
  perspective_id?: string | null
  source_type?: 'memory_capture' | 'past_import' | 'shared_perspective'
}

// Matches the shape returned by `memories` with its media relation.
export type MemoryRow = {
  id: string
  user_id?: string
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
  source_memory_id?: string | null
  shared_context?: string | null
  media?: MediaRow[]
}

export function rowToMemory(
  row: MemoryRow,
  signedUrls = new Map<string, string>(),
  currentUserId?: string
): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    text: row.body,
    date: row.occurred_on,
    time: formatTime(row.occurred_time),
    place: row.place,
    people: row.people,
    topics: row.topics ?? [],
    summary: row.summary ?? '',
    memoryType: row.memory_type ?? '',
    mood: row.mood,
    sourceMemoryId: row.source_memory_id,
    sharedContext: row.shared_context,
    isOwner: currentUserId ? row.user_id === currentUserId : undefined,
    media: (row.media ?? []).flatMap((media): MediaAsset[] => {
      const url = signedUrls.get(media.storage_path)
      return url
        ? [{
            id: media.id,
            storagePath: media.storage_path,
            mediaType: media.media_type,
            fileName: media.file_name,
            fileSize: media.file_size,
            perspectiveId: media.perspective_id,
            sourceType: media.source_type,
            url,
          }]
        : []
    }),
  }
}

export function currentCaptureTime(now = new Date()): MemoryCaptureTime {
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

export function validateCaptureTime(value: unknown): MemoryCaptureTime {
  if (!value || typeof value !== 'object') throw new Error('A capture date and time are required.')
  const { date, time } = value as Partial<MemoryCaptureTime>
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Capture date must use YYYY-MM-DD.')
  }
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Capture time must use HH:MM.')
  }

  const parsedDate = new Date(`${date}T12:00:00Z`)
  const [hour, minute] = time.split(':').map(Number)
  if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date || hour > 23 || minute > 59) {
    throw new Error('Capture date or time is invalid.')
  }
  return { date, time }
}

export function validateMediaInputs(value: unknown, userId: string): NewMediaInput[] {
  if (!Array.isArray(value) || value.length > MAX_MEDIA_PER_MEMORY) {
    throw new Error(`You can attach up to ${MAX_MEDIA_PER_MEMORY} media items.`)
  }

  const userPrefix = `${userId}/`
  const seenPaths = new Set<string>()
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('One or more media items are invalid.')
    const { storagePath, mediaType, fileName, fileSize, perspectiveId } = item as Partial<NewMediaInput>
    const isImage = mediaType === 'image'
    const isAudio = mediaType === 'audio'
    const isDocument = mediaType === 'document'
    const maxBytes = isAudio ? MAX_AUDIO_BYTES : MAX_MEDIA_BYTES

    if (
      typeof storagePath !== 'string' ||
      !storagePath.startsWith(userPrefix) ||
      storagePath.includes('..') ||
      storagePath.split('/').length !== 2 ||
      seenPaths.has(storagePath) ||
      (!isImage && !isAudio && !isDocument) ||
      typeof fileName !== 'string' ||
      !fileName.trim() ||
      typeof fileSize !== 'number' ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > maxBytes
    ) {
      throw new Error('One or more media items are invalid.')
    }
    seenPaths.add(storagePath)
    return {
      storagePath,
      mediaType: isAudio ? 'audio' : isDocument ? 'document' : 'image',
      fileName: fileName.replace(/[\\/\u0000]/g, '_').trim().slice(0, 255),
      fileSize,
      perspectiveId: perspectiveId || null,
    }
  })
}

export async function rowsToMemories(client: SupabaseClient, rows: MemoryRow[], currentUserId?: string) {
  const signedUrls = await signedMediaUrls(client, rows.flatMap((row) => row.media ?? []))
  return rows.map((row) => rowToMemory(row, signedUrls, currentUserId))
}

export async function rowToMemoryWithSignedMedia(client: SupabaseClient, row: MemoryRow, currentUserId?: string) {
  const signedUrls = await signedMediaUrls(client, row.media ?? [])
  return rowToMemory(row, signedUrls, currentUserId)
}

export function memoryTitle(text: string) {
  const firstLine = text.trim().split(/\r?\n|(?<=[.!?])\s/)[0] ?? 'A new memory'
  return firstLine.slice(0, 80) || 'A new memory'
}

export async function signedMediaUrls(client: SupabaseClient, media: MediaRow[]) {
  const photoPaths = [...new Set(media.filter((item) => item.media_type === 'image' || item.media_type === 'document').map((item) => item.storage_path))]
  const audioPaths = [...new Set(media.filter((item) => item.media_type === 'audio').map((item) => item.storage_path))]
  const urlMap = new Map<string, string>()

  if (photoPaths.length > 0) {
    const { data: photoData } = await client.storage.from('memory-photos').createSignedUrls(photoPaths, 60 * 60)
    for (const item of photoData ?? []) {
      if (item.signedUrl && item.path) {
        urlMap.set(item.path, item.signedUrl)
      }
    }
  }

  if (audioPaths.length > 0) {
    const { data: audioData } = await client.storage.from('memory-audio').createSignedUrls(audioPaths, 60 * 60)
    for (const item of audioData ?? []) {
      if (item.signedUrl && item.path) {
        urlMap.set(item.path, item.signedUrl)
      }
    }
  }

  return urlMap
}

function formatTime(time: string) {
  const [hour, minute] = time.slice(0, 5).split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const twelveHour = hour % 12 || 12
  return `${twelveHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

