import { supabase } from './supabase'
import type {
  Memory,
  MediaAsset,
  ConnectedMemory,
  MemoryParticipant,
  MemoryPerspective,
  MemoryNotification,
  UserSearchResult,
  PastImportQuota,
  MemoryClusterCandidate,
  ImportedAsset,
} from '../types/memory'
import { tagMemory, embedText, transcribeAudio } from './ai'
import { isSameCalendarDay } from './format'

export async function getBatchSignedMediaUrls(rawMediaList: ({ storage_path?: string; media_type?: string } | string)[]) {
  const normalized = rawMediaList.map((m) =>
    typeof m === 'string' ? { storage_path: m, media_type: 'image' } : m
  )
  const photoPaths = [...new Set(normalized.filter((m) => m.storage_path && m.media_type !== 'audio').map((m) => m.storage_path!))]
  const audioPaths = [...new Set(normalized.filter((m) => m.storage_path && m.media_type === 'audio').map((m) => m.storage_path!))]
  const urlMap = new Map<string, string>()

  const promises: Promise<any>[] = []

  if (photoPaths.length > 0) {
    promises.push(
      supabase.storage.from('memory-photos').createSignedUrls(photoPaths, 3600).then(({ data }) => {
        for (const item of data ?? []) {
          if (item?.signedUrl && item?.path) {
            urlMap.set(item.path, item.signedUrl)
          }
        }
      })
    )
  }

  if (audioPaths.length > 0) {
    promises.push(
      supabase.storage.from('memory-audio').createSignedUrls(audioPaths, 3600).then(({ data }) => {
        for (const item of data ?? []) {
          if (item?.signedUrl && item?.path) {
            urlMap.set(item.path, item.signedUrl)
          }
        }
      })
    )
  }

  if (promises.length > 0) {
    await Promise.all(promises)
  }

  return urlMap
}

export async function fetchMemories(): Promise<Memory[]> {
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id

  let rawMemories: any = null
  const { data, error: mainError } = await supabase
    .from('memories')
    .select(`
      id,
      user_id,
      title,
      body,
      occurred_on,
      occurred_time,
      place,
      people,
      mood,
      topics,
      summary,
      memory_type,
      source_memory_id,
      shared_context,
      media (
        id,
        storage_path,
        media_type,
        file_name,
        file_size,
        perspective_id,
        created_at
      )
    `)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })

  let error = mainError
  if (error && (error.message.includes('perspective_id') || error.message.includes('source_memory_id') || error.message.includes('shared_context'))) {
    const fallback = await supabase
      .from('memories')
      .select(`
        id,
        user_id,
        title,
        body,
        occurred_on,
        occurred_time,
        place,
        people,
        mood,
        topics,
        summary,
        memory_type,
        media (
          id,
          storage_path,
          media_type,
          file_name,
          file_size,
          created_at
        )
      `)
      .is('deleted_at', null)
      .order('occurred_at', { ascending: false })

    rawMemories = fallback.data
    error = fallback.error
  } else {
    rawMemories = data
  }

  if (error) throw error
  if (!rawMemories) return []

  // Deduplicate: Filter out secondary cloned copies if the parent shared memory is present
  const parentIds = new Set((rawMemories || []).map((r: any) => r.id))
  const filteredRawMemories = (rawMemories || []).filter((r: any) => {
    if (r.source_memory_id && parentIds.has(r.source_memory_id)) {
      return false
    }
    return true
  })

  // Batch fetch all signed URLs in parallel (1-2 batch HTTP calls)
  const allMedia = filteredRawMemories.flatMap((m: any) => (m.media as any[]) || [])
  const signedUrlMap = await getBatchSignedMediaUrls(allMedia)

  const formatted: Memory[] = []

  for (const m of filteredRawMemories) {
    const rawMedia = (m.media as any[]) || []
    const mediaAssets: MediaAsset[] = rawMedia.flatMap((item: any) => {
      const url = signedUrlMap.get(item.storage_path) || ''
      return url
        ? [
            {
              id: item.id,
              url,
              storagePath: item.storage_path,
              mediaType: item.media_type as 'image' | 'audio' | 'document',
              fileName: item.file_name,
              fileSize: Number(item.file_size || 0),
              perspectiveId: item.perspective_id,
              createdAt: item.created_at,
            },
          ]
        : []
    })

    formatted.push({
      id: m.id,
      userId: m.user_id,
      title: m.title || 'Untitled Memory',
      text: m.body,
      date: m.occurred_on,
      time: (m.occurred_time || '12:00:00').slice(0, 5),
      place: m.place || '',
      people: m.people || [],
      mood: m.mood || 'calm',
      topics: m.topics || [],
      summary: m.summary || '',
      memoryType: m.memory_type || 'moment',
      sourceMemoryId: m.source_memory_id,
      sharedContext: m.shared_context,
      isOwner: currentUserId ? m.user_id === currentUserId : true,
      media: mediaAssets,
    })
  }

  return formatted
}

export async function fetchMemoriesPage(
  limit: number = 20,
  cursor?: string
): Promise<{ memories: Memory[]; nextCursor: string | null; hasMore: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id

  const safeLimit = Math.min(Math.max(limit, 1), 100)

  let query = supabase
    .from('memories')
    .select(`
      id,
      user_id,
      title,
      body,
      occurred_at,
      occurred_on,
      occurred_time,
      place,
      people,
      mood,
      topics,
      summary,
      memory_type,
      source_memory_id,
      shared_context,
      media (
        id,
        storage_path,
        media_type,
        file_name,
        file_size,
        perspective_id,
        created_at
      )
    `)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })

  if (cursor) {
    query = query.lt('occurred_at', cursor)
  }

  query = query.limit(safeLimit + 1)

  let rawMemories: any = null
  const { data, error: mainError } = await query

  let error = mainError
  if (error && (error.message.includes('perspective_id') || error.message.includes('source_memory_id') || error.message.includes('shared_context'))) {
    let fallbackQuery = supabase
      .from('memories')
      .select(`
        id,
        user_id,
        title,
        body,
        occurred_at,
        occurred_on,
        occurred_time,
        place,
        people,
        mood,
        topics,
        summary,
        memory_type,
        media (
          id,
          storage_path,
          media_type,
          file_name,
          file_size,
          created_at
        )
      `)
      .is('deleted_at', null)
      .order('occurred_at', { ascending: false })

    if (cursor) {
      fallbackQuery = fallbackQuery.lt('occurred_at', cursor)
    }
    fallbackQuery = fallbackQuery.limit(safeLimit + 1)

    const fallback = await fallbackQuery
    rawMemories = fallback.data
    error = fallback.error
  } else {
    rawMemories = data
  }

  if (error) throw error
  if (!rawMemories) return { memories: [], nextCursor: null, hasMore: false }

  const rows = rawMemories as any[]
  const hasMore = rows.length > safeLimit
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows

  // Deduplicate: Filter out secondary cloned copies if the parent shared memory is present in page
  const parentIds = new Set(pageRows.map((r: any) => r.id))
  const filteredRawMemories = pageRows.filter((r: any) => {
    if (r.source_memory_id && parentIds.has(r.source_memory_id)) {
      return false
    }
    return true
  })

  // Batch fetch signed URLs
  const allMedia = filteredRawMemories.flatMap((m: any) => (m.media as any[]) || [])
  const signedUrlMap = await getBatchSignedMediaUrls(allMedia)

  const formatted: Memory[] = []

  for (const m of filteredRawMemories) {
    const rawMedia = (m.media as any[]) || []
    const mediaAssets: MediaAsset[] = rawMedia.flatMap((item: any) => {
      const url = signedUrlMap.get(item.storage_path) || ''
      return url
        ? [
            {
              id: item.id,
              url,
              storagePath: item.storage_path,
              mediaType: item.media_type as 'image' | 'audio' | 'document',
              fileName: item.file_name,
              fileSize: Number(item.file_size || 0),
              perspectiveId: item.perspective_id,
              createdAt: item.created_at,
            },
          ]
        : []
    })

    formatted.push({
      id: m.id,
      userId: m.user_id,
      title: m.title || 'Untitled Memory',
      text: m.body,
      date: m.occurred_on,
      time: (m.occurred_time || '12:00:00').slice(0, 5),
      place: m.place || '',
      people: m.people || [],
      mood: m.mood || 'calm',
      topics: m.topics || [],
      summary: m.summary || '',
      memoryType: m.memory_type || 'moment',
      sourceMemoryId: m.source_memory_id,
      sharedContext: m.shared_context,
      isOwner: currentUserId ? m.user_id === currentUserId : true,
      media: mediaAssets,
    })
  }

  const nextCursor = hasMore && pageRows.length > 0
    ? (pageRows[pageRows.length - 1] as any).occurred_at || `${pageRows[pageRows.length - 1].occurred_on}T${pageRows[pageRows.length - 1].occurred_time || '12:00:00'}Z`
    : null

  return {
    memories: formatted,
    nextCursor,
    hasMore,
  }
}

export async function createMemory(
  text: string,
  photos: { base64: string; fileName: string; fileSize: number }[],
  options?: {
    customPlace?: string
    customDate?: string
    customTime?: string
  }
): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const occurredOn = options?.customDate || [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const occurredTime = options?.customTime ? `${options.customTime}:00` : [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), '00'].join(':')
  const occurredAt = new Date(`${occurredOn}T${occurredTime}`).toISOString()

  const firstLine = text.trim().split(/\r?\n|(?<=[.!?])\s/)[0] || 'A new memory'
  const title = firstLine.slice(0, 80) || 'A new memory'

  // 1. Insert core memory immediately
  const { data: memoryData, error: memError } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title,
      body: text.trim(),
      occurred_at: occurredAt,
      occurred_on: occurredOn,
      occurred_time: occurredTime,
      place: options?.customPlace?.trim() || 'Home',
      people: [],
      mood: 'calm',
      topics: [],
      summary: '',
      memory_type: 'moment',
      embedding: null,
    })
    .select()
    .single()

  if (memError) throw memError

  // 2. Upload photos in parallel
  const mediaAssets: MediaAsset[] = []
  if (photos.length > 0) {
    const uploadResults = await Promise.all(
      photos.map(async (photo) => {
        const storagePath = `${user.id}/${Date.now()}-${photo.fileName}`
        const buffer = decodeBase64(photo.base64)

        const { error: uploadErr } = await supabase.storage
          .from('memory-photos')
          .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

        if (uploadErr) return null

        const { data: mediaRow } = await supabase
          .from('media')
          .insert({
            memory_id: memoryData.id,
            user_id: user.id,
            storage_path: storagePath,
            media_type: 'image',
            file_name: photo.fileName,
            file_size: photo.fileSize,
          })
          .select()
          .single()

        return { storagePath, photo, mediaRow }
      })
    )

    const validUploads = uploadResults.filter(Boolean) as { storagePath: string; photo: any; mediaRow: any }[]
    if (validUploads.length > 0) {
      const urlMap = await getBatchSignedMediaUrls(validUploads.map((u) => ({ storage_path: u.storagePath, media_type: 'image' })))
      for (const item of validUploads) {
        mediaAssets.push({
          id: item.mediaRow?.id || `${Date.now()}`,
          url: urlMap.get(item.storagePath) || '',
          storagePath: item.storagePath,
          mediaType: 'image',
          fileName: item.photo.fileName,
          fileSize: item.photo.fileSize,
          createdAt: item.mediaRow?.created_at || new Date().toISOString(),
        })
      }
    }
  }

  return {
    id: memoryData.id,
    title: memoryData.title,
    text: memoryData.body,
    date: memoryData.occurred_on,
    time: memoryData.occurred_time?.slice(0, 5) || '12:00',
    place: memoryData.place || '',
    people: memoryData.people || [],
    mood: memoryData.mood || 'calm',
    topics: memoryData.topics || [],
    summary: memoryData.summary || '',
    memoryType: memoryData.memory_type || 'moment',
    media: mediaAssets,
    sourceMemoryId: memoryData.source_memory_id || null,
    userId: memoryData.user_id,
    isProcessing: true,
    processingStatus: 'processing',
  }
}

export async function enrichMemoryMobile(memoryId: string, text: string, customPlace?: string): Promise<Memory | null> {
  try {
    const [tagResult, embedding] = await Promise.all([
      tagMemory(text),
      embedText(text),
    ])

    const place = customPlace?.trim() || tagResult.place || 'Home'

    const { data: updated, error } = await supabase
      .from('memories')
      .update({
        place,
        people: tagResult.people,
        mood: tagResult.mood,
        topics: tagResult.topics,
        summary: tagResult.summary,
        memory_type: tagResult.memoryType,
        embedding: embedding ? embedding : null,
      })
      .eq('id', memoryId)
      .select(`
        id,
        user_id,
        title,
        body,
        occurred_on,
        occurred_time,
        place,
        people,
        mood,
        topics,
        summary,
        memory_type,
        source_memory_id,
        shared_context,
        media (
          id,
          storage_path,
          media_type,
          file_name,
          file_size,
          perspective_id,
          created_at
        )
      `)
      .single()

    if (error || !updated) return null

    const rawMedia = (updated.media as any[]) || []
    const signedUrlMap = await getBatchSignedMediaUrls(rawMedia)

    const mediaAssets: MediaAsset[] = rawMedia.flatMap((item: any) => {
      const url = signedUrlMap.get(item.storage_path) || ''
      return url
        ? [
            {
              id: item.id,
              url,
              storagePath: item.storage_path,
              mediaType: item.media_type as 'image' | 'audio' | 'document',
              fileName: item.file_name,
              fileSize: Number(item.file_size || 0),
              perspectiveId: item.perspective_id,
              createdAt: item.created_at,
            },
          ]
        : []
    })

    return {
      id: updated.id,
      userId: updated.user_id,
      title: updated.title || 'Untitled Memory',
      text: updated.body,
      date: updated.occurred_on,
      time: (updated.occurred_time || '12:00:00').slice(0, 5),
      place: updated.place || '',
      people: updated.people || [],
      mood: updated.mood || 'calm',
      topics: updated.topics || [],
      summary: updated.summary || '',
      memoryType: updated.memory_type || 'moment',
      sourceMemoryId: updated.source_memory_id,
      sharedContext: updated.shared_context,
      media: mediaAssets,
      isProcessing: false,
      processingStatus: 'completed',
    }
  } catch (err) {
    console.error('enrichMemoryMobile error:', err)
    return null
  }
}

export async function createVoiceMemory(
  audioBase64: string,
  fileName: string,
  fileSize: number,
  mimeType: string = 'audio/m4a',
  options?: {
    customPlace?: string
    customDate?: string
    customTime?: string
  }
): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const occurredOn = options?.customDate || [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const occurredTime = options?.customTime ? `${options.customTime}:00` : [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), '00'].join(':')
  const occurredAt = new Date(`${occurredOn}T${occurredTime}`).toISOString()

  // 1. Insert core voice memory immediately
  const { data: memoryData, error: memError } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title: 'Voice memory',
      body: `[Voice memory recorded on ${occurredOn}]`,
      occurred_at: occurredAt,
      occurred_on: occurredOn,
      occurred_time: occurredTime,
      place: options?.customPlace?.trim() || 'Home',
      people: [],
      mood: 'calm',
      topics: ['voice'],
      summary: '',
      memory_type: 'Voice',
      embedding: null,
    })
    .select()
    .single()

  if (memError) throw memError

  // 2. Upload audio file
  const storagePath = `${user.id}/${Date.now()}-${fileName}`
  const buffer = decodeBase64(audioBase64)

  const { error: uploadErr } = await supabase.storage
    .from('memory-audio')
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false })

  const mediaAssets: MediaAsset[] = []
  if (!uploadErr) {
    const { data: mediaRow } = await supabase
      .from('media')
      .insert({
        memory_id: memoryData.id,
        user_id: user.id,
        storage_path: storagePath,
        media_type: 'audio',
        file_name: fileName,
        file_size: fileSize,
      })
      .select()
      .single()

    const urlMap = await getBatchSignedMediaUrls([{ storage_path: storagePath, media_type: 'audio' }])

    if (mediaRow) {
      mediaAssets.push({
        id: mediaRow.id,
        url: urlMap.get(storagePath) || '',
        storagePath: storagePath,
        mediaType: 'audio',
        fileName: fileName,
        fileSize: fileSize,
        createdAt: mediaRow.created_at,
      })
    }
  }

  return {
    id: memoryData.id,
    title: memoryData.title,
    text: memoryData.body,
    date: memoryData.occurred_on,
    time: (memoryData.occurred_time || '12:00:00').slice(0, 5),
    place: memoryData.place || '',
    people: memoryData.people || [],
    mood: memoryData.mood || 'calm',
    topics: memoryData.topics || [],
    summary: memoryData.summary || '',
    memoryType: memoryData.memory_type,
    media: mediaAssets,
    isProcessing: true,
    processingStatus: 'processing',
  }
}

export async function processVoiceMemoryMobile(
  memoryId: string,
  audioBase64: string,
  mimeType: string = 'audio/m4a',
  capturedDate?: string
): Promise<Memory | null> {
  try {
    let transcribed = await transcribeAudio(audioBase64, mimeType)
    if (!transcribed.trim()) {
      transcribed = `[Voice memory recorded on ${capturedDate || 'today'}]`
    }

    const [tagResult, embedding] = await Promise.all([
      tagMemory(transcribed),
      embedText(transcribed),
    ])

    const firstLine = transcribed.trim().split(/\r?\n|(?<=[.!?])\s/)[0] || 'Voice memory'
    const title = transcribed.trim() ? (firstLine.slice(0, 80) || tagResult.title || 'Voice memory') : 'Voice memory'

    const { data: updated, error } = await supabase
      .from('memories')
      .update({
        title,
        body: transcribed,
        place: tagResult.place || 'Home',
        people: tagResult.people,
        mood: tagResult.mood,
        topics: tagResult.topics,
        summary: tagResult.summary,
        memory_type: 'Voice',
        embedding: embedding ? embedding : null,
      })
      .eq('id', memoryId)
      .select(`
        id,
        user_id,
        title,
        body,
        occurred_on,
        occurred_time,
        place,
        people,
        mood,
        topics,
        summary,
        memory_type,
        source_memory_id,
        shared_context,
        media (
          id,
          storage_path,
          media_type,
          file_name,
          file_size,
          perspective_id,
          created_at
        )
      `)
      .single()

    if (error || !updated) return null

    const rawMedia = (updated.media as any[]) || []
    const signedUrlMap = await getBatchSignedMediaUrls(rawMedia)

    const mediaAssets: MediaAsset[] = rawMedia.flatMap((item: any) => {
      const url = signedUrlMap.get(item.storage_path) || ''
      return url
        ? [
            {
              id: item.id,
              url,
              storagePath: item.storage_path,
              mediaType: item.media_type as 'image' | 'audio' | 'document',
              fileName: item.file_name,
              fileSize: Number(item.file_size || 0),
              perspectiveId: item.perspective_id,
              createdAt: item.created_at,
            },
          ]
        : []
    })

    return {
      id: updated.id,
      userId: updated.user_id,
      title: updated.title,
      text: updated.body,
      date: updated.occurred_on,
      time: (updated.occurred_time || '12:00:00').slice(0, 5),
      place: updated.place || '',
      people: updated.people || [],
      mood: updated.mood || 'calm',
      topics: updated.topics || [],
      summary: updated.summary || '',
      memoryType: updated.memory_type || 'Voice',
      sourceMemoryId: updated.source_memory_id,
      sharedContext: updated.shared_context,
      media: mediaAssets,
      isProcessing: false,
      processingStatus: 'completed',
    }
  } catch (err) {
    console.error('processVoiceMemoryMobile error:', err)
    await supabase
      .from('memories')
      .update({ processing_status: 'failed' })
      .eq('id', memoryId)

    return null
  }
}

export async function retryVoiceEnrichmentMobile(memoryId: string): Promise<Memory | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Query media row
  const { data: media } = await supabase
    .from('media')
    .select('storage_path, media_type')
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)
    .eq('media_type', 'audio')
    .maybeSingle()

  if (!media?.storage_path) {
    return enrichMemoryMobile(memoryId, '')
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
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const audioBase64 = btoa(binary)
  const ext = media.storage_path.split('.').pop()?.toLowerCase() || 'm4a'
  const mimeType = ext === 'mp4' || ext === 'm4a' ? 'audio/m4a' : 'audio/webm'

  return processVoiceMemoryMobile(memoryId, audioBase64, mimeType)
}

export async function deleteMemory(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Find media files to remove
  const { data: mediaFiles } = await supabase
    .from('media')
    .select('storage_path, media_type')
    .eq('memory_id', id)
    .eq('user_id', user.id)

  if (mediaFiles) {
    const photos = mediaFiles.filter((m) => m.media_type === 'image').map((m) => m.storage_path)
    const audio = mediaFiles.filter((m) => m.media_type === 'audio').map((m) => m.storage_path)

    if (photos.length > 0) await supabase.storage.from('memory-photos').remove(photos)
    if (audio.length > 0) await supabase.storage.from('memory-audio').remove(audio)
  }

  await supabase.from('memories').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
}

export function getConnectedMemories(target: Memory, allMemories: Memory[], limit: number = 3): ConnectedMemory[] {
  const others = allMemories.filter((m) => m.id !== target.id)
  const connected: ConnectedMemory[] = []

  for (const m of others) {
    // 1. Shared People
    const sharedPeople = target.people.filter((p) => m.people.includes(p))
    if (sharedPeople.length > 0) {
      connected.push({
        ...m,
        similarity: 0.9,
        relationshipType: 'people',
        connectionReason: `Also with ${sharedPeople.join(', ')}`,
      })
      continue
    }

    // 2. Same Place
    if (target.place && m.place && target.place.toLowerCase() === m.place.toLowerCase() && target.place.toLowerCase() !== 'home') {
      connected.push({
        ...m,
        similarity: 0.85,
        relationshipType: 'place',
        connectionReason: `Both took place in ${target.place}`,
      })
      continue
    }

    // 3. Shared Topic
    const sharedTopics = target.topics.filter((t) => m.topics.includes(t))
    if (sharedTopics.length > 0) {
      connected.push({
        ...m,
        similarity: 0.8,
        relationshipType: 'topic',
        connectionReason: `Related to ${sharedTopics[0]}`,
      })
      continue
    }

    // 4. Time pattern (same day in another year)
    if (target.date.slice(5) === m.date.slice(5) && target.date.slice(0, 4) !== m.date.slice(0, 4)) {
      const yearDiff = Math.abs(parseInt(target.date.slice(0, 4)) - parseInt(m.date.slice(0, 4)))
      connected.push({
        ...m,
        similarity: 0.75,
        relationshipType: 'time',
        connectionReason: `Happened on this same day ${yearDiff} year${yearDiff === 1 ? '' : 's'} apart`,
      })
      continue
    }
  }

  return connected.slice(0, limit)
}

export async function addPhotoToMemory(
  memoryId: string,
  memoryDate: string,
  photo: { base64: string; fileName: string; fileSize: number }
): Promise<MediaAsset> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Step 1: Client-Side Pre-Check for Same-Day Restriction
  const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  if (!isSameCalendarDay(memoryDate, clientTz)) {
    throw new Error('Photos can only be added to memories from today.')
  }

  // Step 2: Check memory eligibility on server before uploading
  let rpcAvailable = true
  const { error: verifyErr } = await supabase.rpc('verify_memory_photo_eligibility', {
    p_memory_id: memoryId,
    p_client_timezone: clientTz,
  })

  if (verifyErr) {
    if (verifyErr.message?.includes('Photos can only be added to memories from today.')) {
      throw new Error('Photos can only be added to memories from today.')
    }
    // If function is not yet in schema cache (PGRST202), fall back to direct table verification
    if (verifyErr.code === 'PGRST202' || verifyErr.message?.includes('Could not find the function')) {
      rpcAvailable = false
      const { data: mem, error: memErr } = await supabase
        .from('memories')
        .select('id, user_id, occurred_on')
        .eq('id', memoryId)
        .is('deleted_at', null)
        .single()

      if (memErr || !mem || mem.user_id !== user.id) {
        throw new Error('Memory not found or unauthorized.')
      }
      if (!isSameCalendarDay(mem.occurred_on, clientTz)) {
        throw new Error('Photos can only be added to memories from today.')
      }
    } else {
      throw new Error(verifyErr.message || 'Memory is not eligible for photo attachment.')
    }
  }

  // Step 3: Generate/approve upload storage path
  const sanitizedFileName = photo.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${user.id}/${Date.now()}-${sanitizedFileName}`
  const buffer = decodeBase64(photo.base64)

  // Step 4: Upload to memory-photos bucket
  const { error: uploadErr } = await supabase.storage
    .from('memory-photos')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

  if (uploadErr) {
    throw new Error(`Upload failed: ${uploadErr.message}`)
  }

  // Step 5: Atomically attach media record
  let mediaRow: any = null
  if (rpcAvailable) {
    const { data: rpcRow, error: attachErr } = await supabase.rpc('attach_photo_to_memory', {
      p_memory_id: memoryId,
      p_storage_path: storagePath,
      p_file_name: photo.fileName,
      p_file_size: photo.fileSize,
      p_client_timezone: clientTz,
    })

    if (attachErr) {
      if (attachErr.code === 'PGRST202' || attachErr.message?.includes('Could not find the function')) {
        // Fallback to table insert
        const { data: directRow, error: directErr } = await supabase
          .from('media')
          .insert({
            memory_id: memoryId,
            user_id: user.id,
            storage_path: storagePath,
            media_type: 'image',
            file_name: photo.fileName,
            file_size: photo.fileSize,
          })
          .select()
          .single()

        if (directErr) {
          await supabase.storage.from('memory-photos').remove([storagePath])
          throw new Error(directErr.message || 'Failed to attach photo.')
        }
        mediaRow = directRow
      } else {
        await supabase.storage.from('memory-photos').remove([storagePath])
        if (attachErr.message?.includes('Photos can only be added to memories from today.')) {
          throw new Error('Photos can only be added to memories from today.')
        }
        throw new Error(attachErr.message || 'Failed to attach photo.')
      }
    } else {
      mediaRow = rpcRow
    }
  } else {
    // Direct table insert with RLS
    const { data: directRow, error: directErr } = await supabase
      .from('media')
      .insert({
        memory_id: memoryId,
        user_id: user.id,
        storage_path: storagePath,
        media_type: 'image',
        file_name: photo.fileName,
        file_size: photo.fileSize,
      })
      .select()
      .single()

    if (directErr) {
      await supabase.storage.from('memory-photos').remove([storagePath])
      throw new Error(directErr.message || 'Failed to attach photo.')
    }
    mediaRow = directRow
  }


  // Generate signed URL for immediate rendering in UI
  const { data: signed } = await supabase.storage.from('memory-photos').createSignedUrl(storagePath, 3600)

  return {
    id: mediaRow?.id || `${Date.now()}`,
    url: signed?.signedUrl || '',
    storagePath: storagePath,
    mediaType: 'image',
    fileName: photo.fileName,
    fileSize: photo.fileSize,
    createdAt: mediaRow?.created_at || new Date().toISOString(),
  }
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
// ==========================================================================
// Phase 9: Shared Memories & Perspectives Services
// ==========================================================================

// In-memory cache for mobile user search (5 minute TTL)
const mobileUserSearchCache = new Map<string, { timestamp: number; results: UserSearchResult[] }>()
const MOBILE_USER_SEARCH_TTL = 5 * 60 * 1000

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const trimmed = (query || '').trim().toLowerCase()
  const cacheKey = `${user.id}:${trimmed}`

  const cached = mobileUserSearchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < MOBILE_USER_SEARCH_TTL) {
    return cached.results
  }

  try {
    let results: UserSearchResult[] = []

    if (!trimmed) {
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
          .select('id, display_name, email, avatar_url')
          .in('id', Array.from(relatedIds))
          .limit(10)

        if (profiles) {
          results = profiles.map((p) => ({
            id: p.id,
            displayName: p.display_name?.trim() || p.email?.split('@')[0] || 'Friend',
            email: p.email || '',
            avatarUrl: p.avatar_url,
          }))
        }
      }
    } else {
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .neq('id', user.id)
        .or(`display_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .limit(10)

      if (!profileErr && profiles && profiles.length > 0) {
        results = profiles.map((p) => ({
          id: p.id,
          displayName: p.display_name?.trim() || p.email?.split('@')[0] || 'Thenvue User',
          email: p.email || '',
          avatarUrl: p.avatar_url,
        }))
      } else {
        const { data: rpcData } = await supabase.rpc('search_users_to_invite', {
          search_query: trimmed,
        })
        if (Array.isArray(rpcData)) {
          results = rpcData.map((u: any) => ({
            id: u.id,
            email: u.email || '',
            displayName: u.display_name || u.email?.split('@')[0] || 'User',
            avatarUrl: u.avatar_url,
          }))
        }
      }
    }

    mobileUserSearchCache.set(cacheKey, { timestamp: Date.now(), results })
    return results
  } catch (err) {
    console.error('searchUsers error:', err)
    return []
  }
}

export async function inviteParticipants(memoryId: string, userIds: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: memory } = await supabase
    .from('memories')
    .select('id, title, user_id')
    .eq('id', memoryId)
    .single()

  if (!memory || memory.user_id !== user.id) {
    throw new Error('Only the memory owner can invite participants.')
  }

  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const inviterName = inviterProfile?.display_name || user.email?.split('@')[0] || 'A friend'
  const targetIds = [...new Set(userIds.filter((id) => id !== user.id))]

  for (const targetId of targetIds) {
    const { error: pErr } = await supabase
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

    if (!pErr) {
      await supabase.from('notifications').insert({
        user_id: targetId,
        actor_id: user.id,
        memory_id: memoryId,
        type: 'invitation',
        title: `${inviterName} shared a memory with you`,
        body: memory.title || 'Want to add your perspective?',
        status: 'unread',
      })
    }
  }
}

export async function respondToInvitation(
  memoryId: string,
  status: 'accepted' | 'declined'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('memory_participants')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function addPerspective({
  memoryId,
  text,
  photos = [],
  audioBase64,
  mimeType = 'audio/m4a',
  place = '',
  saveToPersonalMemory = false,
}: {
  memoryId: string
  text: string
  photos?: { base64: string; fileName: string; fileSize: number }[]
  audioBase64?: string
  mimeType?: string
  place?: string
  saveToPersonalMemory?: boolean
}): Promise<MemoryPerspective> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let body = text.trim()
  if (!body) {
    body = audioBase64 ? `[Voice perspective recorded on ${new Date().toISOString().slice(0, 10)}]` : 'My perspective on this memory'
  }

  // 1. Fetch memory
  const { data: memory } = await supabase
    .from('memories')
    .select('id, title, user_id, place')
    .eq('id', memoryId)
    .single()

  if (!memory) throw new Error('Memory not found')

  // 2. Insert perspective row immediately (<100ms)
  const { data: perspective, error: pErr } = await supabase
    .from('memory_perspectives')
    .insert({
      memory_id: memoryId,
      user_id: user.id,
      body,
      place: place || memory.place || 'Home',
      people: [],
      topics: ['perspective'],
      mood: 'calm',
      summary: '',
      memory_type: 'Perspective',
      saved_to_personal_memory: saveToPersonalMemory,
      embedding: null,
    })
    .select()
    .single()

  if (pErr) throw pErr

  // Automatically accept participant status
  await supabase
    .from('memory_participants')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)

  const mediaAssets: MediaAsset[] = []

  // 3. Upload photos if present
  if (photos && photos.length > 0) {
    for (const photo of photos) {
      const storagePath = `${user.id}/${Date.now()}-${photo.fileName}`
      const buffer = decodeBase64(photo.base64)
      const { error: upErr } = await supabase.storage
        .from('memory-photos')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

      if (!upErr) {
        const { data: mediaRow } = await supabase
          .from('media')
          .insert({
            memory_id: memoryId,
            perspective_id: perspective.id,
            user_id: user.id,
            storage_path: storagePath,
            media_type: 'image',
            file_name: photo.fileName,
            file_size: photo.fileSize,
          })
          .select()
          .single()

        const { data: signed } = await supabase.storage.from('memory-photos').createSignedUrl(storagePath, 3600)
        if (mediaRow) {
          mediaAssets.push({
            id: mediaRow.id,
            url: signed?.signedUrl || '',
            storagePath: storagePath,
            mediaType: 'image',
            fileName: photo.fileName,
            fileSize: photo.fileSize,
            perspectiveId: perspective.id,
            createdAt: mediaRow.created_at,
          })
        }
      }
    }
  }

  // 4. Upload audio if present
  if (audioBase64) {
    const audioFileName = `voice_perspective_${Date.now()}.m4a`
    const storagePath = `${user.id}/${Date.now()}-${audioFileName}`
    const buffer = decodeBase64(audioBase64)

    const { error: uploadErr } = await supabase.storage
      .from('memory-audio')
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false })

    if (!uploadErr) {
      const { data: mediaRow } = await supabase
        .from('media')
        .insert({
          memory_id: memoryId,
          perspective_id: perspective.id,
          user_id: user.id,
          storage_path: storagePath,
          media_type: 'audio',
          file_name: audioFileName,
          file_size: buffer.length,
        })
        .select()
        .single()

      const { data: signed } = await supabase.storage.from('memory-audio').createSignedUrl(storagePath, 3600)
      if (mediaRow) {
        mediaAssets.push({
          id: mediaRow.id,
          url: signed?.signedUrl || '',
          storagePath: storagePath,
          mediaType: 'audio',
          fileName: audioFileName,
          fileSize: buffer.length,
          perspectiveId: perspective.id,
          createdAt: mediaRow.created_at,
        })
      }
    }
  }

  let personalMemoryId: string | undefined = undefined

  // 5. If user chose "Save to My Memories", create linked personal memory
  if (saveToPersonalMemory) {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', memory.user_id)
      .single()

    const ownerName = ownerProfile?.display_name || 'a friend'
    const now = new Date()
    const occurredOn = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
    const occurredTime = [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), '00'].join(':')

    const { data: personalMemory } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        title: `Perspective on ${memory.title || 'Shared Memory'}`,
        body,
        occurred_at: now.toISOString(),
        occurred_on: occurredOn,
        occurred_time: occurredTime,
        place: place || memory.place || '',
        people: [],
        topics: ['perspective'],
        mood: 'calm',
        summary: '',
        memory_type: 'moment',
        source_memory_id: memoryId,
        shared_context: `From a shared memory with ${ownerName}`,
        embedding: null,
      })
      .select()
      .single()

    if (personalMemory) {
      personalMemoryId = personalMemory.id
      await supabase
        .from('memory_perspectives')
        .update({ personal_memory_id: personalMemory.id })
        .eq('id', perspective.id)
    }
  }

  // 6. Notify memory owner
  const authorName = user.user_metadata?.display_name || 'A friend'
  if (memory.user_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: memory.user_id,
      actor_id: user.id,
      memory_id: memoryId,
      perspective_id: perspective.id,
      type: 'perspective_added',
      title: `${authorName} added a perspective`,
      body: memory.title || body.slice(0, 60),
      status: 'unread',
    })
  }

  // 7. Background AI Enrichment (save first, enrich second)
  ;(async () => {
    try {
      let finalBody = body
      if (audioBase64) {
        try {
          const transcribed = await transcribeAudio(audioBase64, mimeType)
          if (transcribed.trim()) {
            finalBody = transcribed.trim()
            await supabase.from('memory_perspectives').update({ body: finalBody }).eq('id', perspective.id)
          }
        } catch {}
      }

      const [tagResult, embedding] = await Promise.all([
        tagMemory(finalBody),
        embedText(finalBody).catch(() => null),
      ])

      await supabase
        .from('memory_perspectives')
        .update({
          topics: tagResult.topics,
          mood: tagResult.mood,
          summary: tagResult.summary,
          people: tagResult.people,
          embedding: embedding || null,
        })
        .eq('id', perspective.id)

      if (personalMemoryId) {
        await supabase
          .from('memories')
          .update({
            title: tagResult.title || `Perspective on ${memory.title || 'Shared Memory'}`,
            place: tagResult.place || place || memory.place || '',
            people: tagResult.people,
            topics: tagResult.topics,
            mood: tagResult.mood,
            summary: tagResult.summary,
            embedding: embedding || null,
          })
          .eq('id', personalMemoryId)
      }
    } catch (err) {
      console.error('Background mobile perspective enrichment error:', err)
    }
  })()

  return {
    id: perspective.id,
    memoryId: perspective.memory_id,
    userId: perspective.user_id,
    authorName,
    text: perspective.body,
    place: perspective.place || '',
    people: perspective.people || [],
    topics: perspective.topics || [],
    mood: perspective.mood || '',
    summary: perspective.summary || '',
    memoryType: perspective.memory_type,
    media: mediaAssets,
    savedToPersonalMemory: perspective.saved_to_personal_memory,
    personalMemoryId,
    createdAt: perspective.created_at,
    updatedAt: perspective.updated_at,
    isAuthor: true,
  }
}

export async function fetchPerspectivesPage({
  memoryId,
  limit = 10,
  cursor,
}: {
  memoryId: string
  limit?: number
  cursor?: string
}): Promise<{ perspectives: MemoryPerspective[]; nextCursor: string | null; hasMore: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id

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
  let profileMap: Record<string, string> = {}
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)
    if (profiles) {
      for (const p of profiles) {
        profileMap[p.id] = p.display_name || 'Thenvue User'
      }
    }
  }

  // Batch fetch perspective media
  const perspectiveIds = pageRows.map((p) => p.id)
  let mediaByPerspective: Record<string, MediaAsset[]> = {}
  if (perspectiveIds.length > 0) {
    const { data: mediaRows } = await supabase
      .from('media')
      .select('id, storage_path, media_type, file_name, file_size, perspective_id, created_at')
      .in('perspective_id', perspectiveIds)

    if (mediaRows && mediaRows.length > 0) {
      const urlMap = await getBatchSignedMediaUrls(mediaRows)
      for (const row of mediaRows) {
        if (!mediaByPerspective[row.perspective_id]) {
          mediaByPerspective[row.perspective_id] = []
        }
        mediaByPerspective[row.perspective_id].push({
          id: row.id,
          storagePath: row.storage_path,
          mediaType: row.media_type as 'image' | 'audio' | 'document',
          fileName: row.file_name,
          fileSize: Number(row.file_size || 0),
          perspectiveId: row.perspective_id,
          url: urlMap.get(row.storage_path) || '',
          createdAt: row.created_at,
        })
      }
    }
  }

  const perspectives: MemoryPerspective[] = pageRows.map((p) => ({
    id: p.id,
    memoryId: p.memory_id,
    userId: p.user_id,
    authorName: profileMap[p.user_id] || (p.user_id === currentUserId ? 'You' : 'Participant'),
    text: p.body,
    place: p.place || '',
    people: p.people || [],
    topics: p.topics || [],
    mood: p.mood || '',
    summary: p.summary || '',
    memoryType: p.memory_type,
    media: mediaByPerspective[p.id] || [],
    savedToPersonalMemory: p.saved_to_personal_memory,
    personalMemoryId: p.personal_memory_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    isAuthor: p.user_id === currentUserId,
  }))

  const nextCursor = hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1].created_at : null

  return {
    perspectives,
    nextCursor,
    hasMore,
  }
}

export async function deletePerspective(perspectiveId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('memory_perspectives').delete().eq('id', perspectiveId)
}

export async function leaveSharedMemory(memoryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('memory_participants')
    .update({ status: 'left', updated_at: new Date().toISOString() })
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)
}

export async function removeParticipant(memoryId: string, targetUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('memory_participants')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('memory_id', memoryId)
    .eq('user_id', targetUserId)
}

export async function stopSharingMemory(memoryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('memory_participants')
    .delete()
    .eq('memory_id', memoryId)
    .eq('invited_by', user.id)
}

export async function fetchMemoryDetails(memoryId: string): Promise<Memory | null> {
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id

  // Fetch memory
  const { data: m, error } = await supabase
    .from('memories')
    .select(`
      id,
      user_id,
      title,
      body,
      occurred_on,
      occurred_time,
      place,
      people,
      mood,
      topics,
      summary,
      memory_type,
      source_memory_id,
      shared_context,
      media (
        id,
        storage_path,
        media_type,
        file_name,
        file_size,
        perspective_id,
        created_at
      )
    `)
    .eq('id', memoryId)
    .is('deleted_at', null)
    .single()

  if (error || !m) return null

  // Fetch participants
  const { data: rawParticipants } = await supabase
    .from('memory_participants')
    .select('id, memory_id, user_id, invited_by, status, created_at, updated_at')
    .eq('memory_id', memoryId)

  const participantUserIds = (rawParticipants || []).map((p) => p.user_id)
  let participantProfiles: Record<string, string> = {}

  if (participantUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', participantUserIds)

    if (profiles) {
      for (const p of profiles) {
        participantProfiles[p.id] = p.display_name || 'Thenvue User'
      }
    }
  }

  const participants: MemoryParticipant[] = (rawParticipants || []).map((p) => ({
    id: p.id,
    memoryId: p.memory_id,
    userId: p.user_id,
    invitedBy: p.invited_by,
    displayName: participantProfiles[p.user_id] || (p.user_id === currentUserId ? 'You' : 'Participant'),
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }))

  // Fetch perspectives
  const { data: rawPerspectives } = await supabase
    .from('memory_perspectives')
    .select('*')
    .eq('memory_id', memoryId)
    .order('created_at', { ascending: true })

  const perspectiveUserIds = (rawPerspectives || []).map((p) => p.user_id)
  let perspectiveProfiles: Record<string, string> = {}

  if (perspectiveUserIds.length > 0) {
    const { data: pProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', perspectiveUserIds)

    if (pProfiles) {
      for (const p of pProfiles) {
        perspectiveProfiles[p.id] = p.display_name || 'Thenvue User'
      }
    }
  }

  // Generate signed URLs for all memory media
  const rawMedia = (m.media as any[]) || []
  const mediaAssets: MediaAsset[] = []

  for (const item of rawMedia) {
    const bucket = item.media_type === 'audio' ? 'memory-audio' : 'memory-photos'
    const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(item.storage_path, 3600)

    mediaAssets.push({
      id: item.id,
      url: signed?.signedUrl || '',
      storagePath: item.storage_path,
      mediaType: item.media_type as 'image' | 'audio' | 'document',
      fileName: item.file_name,
      fileSize: Number(item.file_size || 0),
      perspectiveId: item.perspective_id,
      createdAt: item.created_at,
    })
  }

  const perspectives: MemoryPerspective[] = (rawPerspectives || []).map((p) => {
    const pMedia = mediaAssets.filter((med) => med.perspectiveId === p.id)
    return {
      id: p.id,
      memoryId: p.memory_id,
      userId: p.user_id,
      authorName: perspectiveProfiles[p.user_id] || (p.user_id === currentUserId ? 'You' : 'Participant'),
      text: p.body,
      place: p.place || '',
      people: p.people || [],
      topics: p.topics || [],
      mood: p.mood || '',
      summary: p.summary || '',
      memoryType: p.memory_type,
      media: pMedia,
      savedToPersonalMemory: p.saved_to_personal_memory,
      personalMemoryId: p.personal_memory_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      isAuthor: currentUserId ? p.user_id === currentUserId : false,
    }
  })

  // Primary memory media (not attached to perspectives)
  const primaryMedia = mediaAssets.filter((med) => !med.perspectiveId)

  return {
    id: m.id,
    userId: m.user_id,
    title: m.title || 'Untitled Memory',
    text: m.body,
    date: m.occurred_on,
    time: (m.occurred_time || '12:00:00').slice(0, 5),
    place: m.place || '',
    people: m.people || [],
    mood: m.mood || 'calm',
    topics: m.topics || [],
    summary: m.summary || '',
    memoryType: m.memory_type || 'moment',
    sourceMemoryId: m.source_memory_id,
    sharedContext: m.shared_context,
    isOwner: currentUserId ? m.user_id === currentUserId : true,
    media: primaryMedia,
    participants,
    perspectives,
  }
}

export async function fetchNotifications(): Promise<MemoryNotification[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: rawNotifs } = await supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      actor_id,
      memory_id,
      perspective_id,
      type,
      title,
      body,
      status,
      created_at,
      memories (
        title
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (!rawNotifs) return []

  const actorIds = rawNotifs.map((n) => n.actor_id)
  let actorProfiles: Record<string, string> = {}

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', actorIds)

    if (profiles) {
      for (const p of profiles) {
        actorProfiles[p.id] = p.display_name || 'Someone'
      }
    }
  }

  return rawNotifs.map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    actorId: n.actor_id,
    actorName: actorProfiles[n.actor_id] || 'Someone',
    memoryId: n.memory_id,
    memoryTitle: n.memories?.title || 'Shared Memory',
    perspectiveId: n.perspective_id,
    type: n.type,
    title: n.title,
    body: n.body,
    status: n.status,
    createdAt: n.created_at,
  }))
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('id', notificationId)
    .eq('user_id', user.id)
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('user_id', user.id)
    .eq('status', 'unread')
}

// ==========================================================================
// Phase 10: Rediscover Mobile Services
// ==========================================================================

export async function getPastImportQuotaMobile(): Promise<PastImportQuota> {
  const { data: { user } } = await supabase.auth.getUser()
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

  // Fallback direct count
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

export type MobilePastPhotoInput = {
  uri?: string
  base64?: string
  storagePath?: string
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
}

export async function uploadAndProcessPastPhotosMobile({
  photos,
}: {
  photos: MobilePastPhotoInput[]
}): Promise<{
  candidates: MemoryClusterCandidate[]
  duplicateCount: number
  failedCount: number
}> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (photos.length === 0) throw new Error('No photos provided.')

  // 1. Quota check
  const quota = await getPastImportQuotaMobile()
  if (photos.length > quota.remaining) {
    throw new Error(`You have ${quota.remaining} past photo slot${quota.remaining === 1 ? '' : 's'} remaining.`)
  }

  const { extractPhotoMetadataMobile } = await import('./photo-date-extractor')
  const uploadedAssets: ImportedAsset[] = []
  const storagePathsForSigning: string[] = []
  let duplicateCount = 0
  let failedCount = 0

  // Parallel upload with concurrency limit 5
  const UPLOAD_CONCURRENCY = 5
  for (let i = 0; i < photos.length; i += UPLOAD_CONCURRENCY) {
    const chunk = photos.slice(i, i + UPLOAD_CONCURRENCY)
    await Promise.all(
      chunk.map(async (photo) => {
        try {
          const ext = photo.fileName.split('.').pop()?.toLowerCase() || 'jpg'
          const storagePath = photo.storagePath || `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`
          const contentType = photo.mimeType || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg')

          let bytes: Uint8Array | null = null
          if (photo.base64) {
            bytes = decodeBase64(photo.base64)
          } else if (photo.uri) {
            const resp = await fetch(photo.uri)
            const ab = await resp.arrayBuffer()
            bytes = new Uint8Array(ab)
          }

          if (bytes && !photo.storagePath) {
            const { error: uploadErr } = await supabase.storage
              .from('memory-photos')
              .upload(storagePath, bytes, { contentType, upsert: false })

            if (uploadErr) {
              failedCount++
              return
            }
          }

          const extracted = bytes
            ? extractPhotoMetadataMobile({
                bytes,
                fileName: photo.fileName,
                nativeCreationDate: photo.nativeCreationDate,
              })
            : {
                capturedAt: photo.capturedAt || null,
                capturedDate: photo.capturedDate || null,
                capturedTime: photo.capturedTime || null,
                dateSource: photo.dateSource || 'unknown',
                dateStatus: photo.dateStatus || 'unknown',
                importedAt: new Date().toISOString(),
                latitude: photo.latitude ?? null,
                longitude: photo.longitude ?? null,
              }

          const assetId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
          storagePathsForSigning.push(storagePath)

          uploadedAssets.push({
            id: assetId,
            userId: user.id,
            storagePath,
            sourceType: 'past_import',
            capturedAt: extracted.capturedAt || photo.capturedAt || null,
            capturedDate: extracted.capturedDate || photo.capturedDate || null,
            capturedTime: extracted.capturedTime || photo.capturedTime || null,
            dateSource: extracted.dateSource || photo.dateSource || 'unknown',
            dateStatus: (extracted.dateStatus || photo.dateStatus || 'unknown') as any,
            importedAt: extracted.importedAt,
            latitude: extracted.latitude ?? photo.latitude ?? null,
            longitude: extracted.longitude ?? photo.longitude ?? null,
            mimeType: contentType,
            fileSize: photo.fileSize,
            processingStatus: 'processed',
            createdAt: new Date().toISOString(),
          })
        } catch {
          failedCount++
        }
      })
    )
  }

  // Batch signed URLs
  if (storagePathsForSigning.length > 0) {
    const signedUrlMap = await getBatchSignedMediaUrls(storagePathsForSigning)
    for (const asset of uploadedAssets) {
      asset.url = signedUrlMap.get(asset.storagePath) || ''
    }
  }

  // 2. Deterministic Clustering by captured date and time proximity
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
    const sameDate = Boolean(asset.capturedDate && prevAsset.capturedDate && asset.capturedDate === prevAsset.capturedDate)
    const bothUnknown = !asset.capturedDate && !prevAsset.capturedDate

    if (sameDate) {
      const hasTimestamps = asset.capturedAt && prevAsset.capturedAt
      const timeDiffHours = hasTimestamps
        ? Math.abs(new Date(asset.capturedAt!).getTime() - new Date(prevAsset.capturedAt!).getTime()) / (1000 * 60 * 60)
        : null

      const isNearbyTime = timeDiffHours !== null ? timeDiffHours <= 4 : currentCluster.length < 8
      if (isNearbyTime) {
        currentCluster.push(asset)
      } else {
        rawClusters.push(currentCluster)
        currentCluster = [asset]
      }
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

  // 3. AI Understanding in Parallel (concurrency 3)
  const candidates: MemoryClusterCandidate[] = []
  const CLUSTER_CONCURRENCY = 3

  for (let i = 0; i < rawClusters.length; i += CLUSTER_CONCURRENCY) {
    const clusterChunk = rawClusters.slice(i, i + CLUSTER_CONCURRENCY)
    const chunkCandidates = await Promise.all(
      clusterChunk.map(async (clusterAssets) => {
        const clusterId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        const firstAssetWithDate = clusterAssets.find((a) => a.capturedDate) || clusterAssets[0]
        const clusterDate = firstAssetWithDate?.capturedDate || null
        const clusterTime = firstAssetWithDate?.capturedTime || '12:00'
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
          const tags = await tagMemory(`Past moment with ${clusterAssets.length} photos around ${clusterDate || 'past'}`)
          if (tags.summary) inferredSummary = tags.summary
          if (tags.place) inferredPlace = tags.place
          if (tags.topics?.length) inferredTopics = tags.topics
          if (tags.mood) inferredMood = tags.mood
        } catch {
          // Graceful fallback
        }

        return {
          id: clusterId,
          userId: user.id,
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

  return { candidates, duplicateCount, failedCount }
}

export async function saveRediscoveredMemoryMobile({
  title,
  story,
  date,
  time,
  place = '',
  people = [],
  topics = [],
  mood = 'reflective',
  storagePaths = [],
}: {
  title: string
  story?: string
  date: string
  time?: string
  place?: string
  people?: string[]
  topics?: string[]
  mood?: string
  storagePaths: string[]
}): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const cleanDate = date?.trim()
  if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error('A valid capture date (YYYY-MM-DD) is required to save this rediscovered memory.')
  }

  const rawTime = (time || '12:00:00').trim()
  const cleanTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime.length === 8 ? rawTime : '12:00:00'

  const effectiveTitle = title.trim() || 'Rediscovered Memory'
  const effectiveBody = story?.trim() || `Rediscovered memory from ${cleanDate} with ${storagePaths.length} photo${storagePaths.length === 1 ? '' : 's'}.`
  const finalTopics = topics.length > 0 ? topics : ['past photos', 'rediscover']
  const finalPeople = people
  const finalPlace = place.trim()
  const finalMood = mood || 'reflective'

  // P2: Insert core memory immediately (<100ms) with processing_status = 'processing'
  const { data: memoryData, error: memError } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title: effectiveTitle,
      body: effectiveBody,
      occurred_at: `${cleanDate}T${cleanTime}.000Z`,
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
    .select()
    .single()

  if (memError || !memoryData) throw new Error(memError?.message || 'Could not save memory.')

  // Parallel media insert
  const mediaAssets: MediaAsset[] = []
  if (storagePaths.length > 0) {
    const signedUrlMap = await getBatchSignedMediaUrls(storagePaths)
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
          .select()
          .single()

        return {
          id: mRow?.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: signedUrlMap.get(path) || '',
          storagePath: path,
          mediaType: 'image' as const,
          fileName,
          fileSize: 150000,
          createdAt: mRow?.created_at || new Date().toISOString(),
          sourceType: 'past_import' as const,
        }
      })
    )
    mediaAssets.push(...insertedMedia)
  }

  return {
    id: memoryData.id,
    userId: memoryData.user_id,
    title: memoryData.title,
    text: memoryData.body,
    date: memoryData.occurred_on,
    time: cleanTime,
    place: memoryData.place || '',
    people: memoryData.people || [],
    topics: memoryData.topics || [],
    mood: memoryData.mood || '',
    summary: memoryData.summary || '',
    memoryType: memoryData.memory_type || 'moment',
    media: mediaAssets,
    isOwner: true,
    isProcessing: true,
    processingStatus: 'processing',
  }
}

export async function updateMemory(
  id: string,
  updates: {
    title?: string
    text?: string
    place?: string
    date?: string
    time?: string
  }
): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const cleanDate = updates.date || now.toISOString().slice(0, 10)
  const cleanTime = updates.time || now.toTimeString().slice(0, 5)

  const payload: any = {}
  if (updates.title !== undefined) payload.title = updates.title
  if (updates.text !== undefined) payload.body = updates.text
  if (updates.place !== undefined) payload.place = updates.place
  if (updates.date !== undefined) {
    payload.occurred_on = cleanDate
    payload.occurred_at = `${cleanDate}T${cleanTime}.000Z`
  }
  if (updates.time !== undefined) {
    payload.occurred_time = cleanTime
    payload.occurred_at = `${cleanDate}T${cleanTime}.000Z`
  }

  // If text changed, update summary & embedding
  if (updates.text) {
    try {
      const [tags, embedding] = await Promise.all([
        tagMemory(updates.text),
        embedText(updates.text),
      ])
      if (tags.summary) payload.summary = tags.summary
      if (embedding && Array.isArray(embedding) && embedding.length > 0) payload.embedding = embedding
      if (tags.topics && tags.topics.length > 0) payload.topics = tags.topics
    } catch (e) {
      console.warn('AI re-tagging skipped:', e)
    }
  }

  const { data: updatedRow, error } = await supabase
    .from('memories')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`
      id,
      user_id,
      title,
      body,
      occurred_on,
      occurred_time,
      place,
      people,
      mood,
      topics,
      summary,
      memory_type,
      media (
        id,
        storage_path,
        media_type,
        file_name,
        file_size,
        created_at
      )
    `)
    .single()

  if (error || !updatedRow) throw new Error(error?.message || 'Could not update memory.')

  const mediaAssets: MediaAsset[] = []
  for (const m of updatedRow.media || []) {
    const bucket = m.media_type === 'audio' ? 'memory-audio' : 'memory-photos'
    const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(m.storage_path, 3600)
    mediaAssets.push({
      id: m.id,
      url: signed?.signedUrl || '',
      storagePath: m.storage_path,
      mediaType: m.media_type,
      fileName: m.file_name,
      fileSize: m.file_size,
      createdAt: m.created_at,
    })
  }

  return {
    id: updatedRow.id,
    userId: updatedRow.user_id,
    title: updatedRow.title,
    text: updatedRow.body,
    date: updatedRow.occurred_on,
    time: updatedRow.occurred_time,
    place: updatedRow.place || '',
    people: updatedRow.people || [],
    topics: updatedRow.topics || [],
    mood: updatedRow.mood || '',
    summary: updatedRow.summary || '',
    memoryType: updatedRow.memory_type || 'moment',
    media: mediaAssets,
    isOwner: true,
  }
}

export async function deleteMedia(mediaId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: mediaRow } = await supabase
    .from('media')
    .select('id, storage_path, media_type, memory_id')
    .eq('id', mediaId)
    .single()

  if (!mediaRow) return

  // Delete from storage
  const bucket = mediaRow.media_type === 'audio' ? 'memory-audio' : 'memory-photos'
  if (mediaRow.storage_path) {
    await supabase.storage.from(bucket).remove([mediaRow.storage_path])
  }

  // Delete row
  await supabase.from('media').delete().eq('id', mediaId)
}



