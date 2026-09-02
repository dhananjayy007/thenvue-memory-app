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

  const formatted: Memory[] = []

  for (const m of filteredRawMemories) {
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


export async function createMemory(
  text: string,
  photos: { base64: string; fileName: string; fileSize: number }[]
): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const occurredOn = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const occurredTime = [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), '00'].join(':')
  const occurredAt = now.toISOString()

  // 1. AI Tagging & Embedding
  const [tagResult, embedding] = await Promise.all([
    tagMemory(text),
    embedText(text),
  ])

  // 2. Insert memory
  const { data: memoryData, error: memError } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title: tagResult.title,
      body: text.trim(),
      occurred_at: occurredAt,
      occurred_on: occurredOn,
      occurred_time: occurredTime,
      place: tagResult.place,
      people: tagResult.people,
      mood: tagResult.mood,
      topics: tagResult.topics,
      summary: tagResult.summary,
      memory_type: tagResult.memoryType,
      embedding: embedding ? embedding : null,
    })
    .select()
    .single()

  if (memError) throw memError

  // 3. Upload photos
  const mediaAssets: MediaAsset[] = []
  for (const photo of photos) {
    const storagePath = `${user.id}/${Date.now()}-${photo.fileName}`
    const buffer = decodeBase64(photo.base64)

    const { error: uploadErr } = await supabase.storage
      .from('memory-photos')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

    if (!uploadErr) {
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

      const { data: signed } = await supabase.storage.from('memory-photos').createSignedUrl(storagePath, 3600)

      if (mediaRow) {
        mediaAssets.push({
          id: mediaRow.id,
          url: signed?.signedUrl || '',
          storagePath: storagePath,
          mediaType: 'image',
          fileName: photo.fileName,
          fileSize: photo.fileSize,
          createdAt: mediaRow.created_at,
        })
      }
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
  }
}

export async function createVoiceMemory(
  audioBase64: string,
  fileName: string,
  fileSize: number,
  mimeType: string = 'audio/m4a'
): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const occurredOn = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const occurredTime = [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), '00'].join(':')
  const occurredAt = now.toISOString()

  // 1. Transcribe audio with Gemini
  let transcribed = await transcribeAudio(audioBase64, mimeType)
  if (!transcribed.trim()) {
    transcribed = `[Voice memory recorded on ${occurredOn}]`
  }

  // 2. Tag and embed
  const [tagResult, embedding] = await Promise.all([
    tagMemory(transcribed),
    embedText(transcribed),
  ])

  // 3. Insert memory
  const { data: memoryData, error: memError } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title: tagResult.title || 'Voice Memory',
      body: transcribed,
      occurred_at: occurredAt,
      occurred_on: occurredOn,
      occurred_time: occurredTime,
      place: tagResult.place,
      people: tagResult.people,
      mood: tagResult.mood,
      topics: tagResult.topics,
      summary: tagResult.summary,
      memory_type: tagResult.memoryType,
      embedding: embedding ? embedding : null,
    })
    .select()
    .single()

  if (memError) throw memError

  // 4. Upload audio file
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

    const { data: signed } = await supabase.storage.from('memory-audio').createSignedUrl(storagePath, 3600)

    if (mediaRow) {
      mediaAssets.push({
        id: mediaRow.id,
        url: signed?.signedUrl || '',
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
  }
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

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return []

  const { data, error } = await supabase.rpc('search_users_to_invite', {
    search_query: trimmed,
  })

  if (error) {
    // Fallback: search profiles table directly
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .neq('id', user?.id || '')
      .ilike('display_name', `%${trimmed}%`)
      .limit(10)

    if (!profiles) return []
    return profiles.map((p) => ({
      id: p.id,
      displayName: p.display_name || 'Thenvue User',
      email: '',
    }))
  }

  return (data || []).map((u: any) => ({
    id: u.id,
    displayName: u.display_name || 'Thenvue User',
    email: u.email || '',
  }))
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

  const inviterName = user.user_metadata?.display_name || 'Someone'

  for (const targetId of userIds) {
    if (targetId === user.id) continue

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
  if (audioBase64) {
    try {
      const transcribed = await transcribeAudio(audioBase64, mimeType)
      if (transcribed.trim()) body = transcribed.trim()
    } catch {}
  }

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

  // 2. AI Tagging & Embedding
  const [tagResult, embedding] = await Promise.all([
    tagMemory(body),
    embedText(body),
  ])

  // 3. Insert perspective row
  const { data: perspective, error: pErr } = await supabase
    .from('memory_perspectives')
    .insert({
      memory_id: memoryId,
      user_id: user.id,
      body,
      place: place || tagResult.place || '',
      people: tagResult.people,
      topics: tagResult.topics,
      mood: tagResult.mood,
      summary: tagResult.summary,
      memory_type: 'Perspective',
      saved_to_personal_memory: saveToPersonalMemory,
      embedding: embedding ? embedding : null,
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

  // 4. Upload photos
  for (const photo of photos) {
    const storagePath = `${user.id}/${Date.now()}-${photo.fileName}`
    const buffer = decodeBase64(photo.base64)

    const { error: uploadErr } = await supabase.storage
      .from('memory-photos')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

    if (!uploadErr) {
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

  // 5. Upload audio if present
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

  // 6. If user chose "Save to My Memories", create linked personal memory
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
        title: tagResult.title || `Perspective on ${memory.title || 'Shared Memory'}`,
        body,
        occurred_at: now.toISOString(),
        occurred_on: occurredOn,
        occurred_time: occurredTime,
        place: place || tagResult.place || memory.place || '',
        people: tagResult.people,
        topics: tagResult.topics,
        mood: tagResult.mood,
        summary: tagResult.summary,
        memory_type: 'moment',
        source_memory_id: memoryId,
        shared_context: `From a shared memory with ${ownerName}`,
        embedding: embedding ? embedding : null,
      })
      .select()
      .single()

    if (personalMemory) {
      await supabase
        .from('memory_perspectives')
        .update({ personal_memory_id: personalMemory.id })
        .eq('id', perspective.id)
    }
  }

  // 7. Notify memory owner
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
    personalMemoryId: perspective.personal_memory_id,
    createdAt: perspective.created_at,
    updatedAt: perspective.updated_at,
    isAuthor: true,
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
  base64: string
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
  let duplicateCount = 0
  let failedCount = 0

  for (const photo of photos) {
    try {
      const ext = photo.fileName.split('.').pop()?.toLowerCase() || 'jpg'
      const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`
      const bytes = decodeBase64(photo.base64)
      const contentType = photo.mimeType || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg')

      const extracted = extractPhotoMetadataMobile({
        bytes,
        fileName: photo.fileName,
        nativeCreationDate: photo.nativeCreationDate,
      })

      const effectiveCapturedAt = extracted.capturedAt || photo.capturedAt || null
      const effectiveCapturedDate = extracted.capturedDate || photo.capturedDate || null
      const effectiveCapturedTime = extracted.capturedTime || photo.capturedTime || null
      const effectiveDateSource = extracted.dateSource || photo.dateSource || 'unknown'
      const effectiveDateStatus = extracted.dateStatus || photo.dateStatus || 'unknown'

      const { error: uploadErr } = await supabase.storage
        .from('memory-photos')
        .upload(storagePath, bytes, { contentType, upsert: false })

      if (uploadErr) {
        failedCount++
        continue
      }

      const { data: signed } = await supabase.storage
        .from('memory-photos')
        .createSignedUrl(storagePath, 3600)

      const assetId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const assetUrl = signed?.signedUrl || ''

      uploadedAssets.push({
        id: assetId,
        userId: user.id,
        storagePath,
        sourceType: 'past_import',
        capturedAt: effectiveCapturedAt,
        capturedDate: effectiveCapturedDate,
        capturedTime: effectiveCapturedTime,
        dateSource: effectiveDateSource,
        dateStatus: effectiveDateStatus,
        importedAt: extracted.importedAt,
        latitude: extracted.latitude ?? photo.latitude ?? null,
        longitude: extracted.longitude ?? photo.longitude ?? null,
        mimeType: contentType,
        fileSize: photo.fileSize,
        processingStatus: 'processed',
        createdAt: new Date().toISOString(),
        url: assetUrl,
      })
    } catch {
      failedCount++
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

  // 3. AI Understanding
  const candidates: MemoryClusterCandidate[] = []

  for (const clusterAssets of rawClusters) {
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

    candidates.push({
      id: clusterId,
      userId: user.id,
      title: inferredTitle,
      summary: inferredSummary,
      suggestedDate: clusterDate,
      suggestedTime: clusterTime,
      dateSource: clusterDateSource,
      dateStatus: clusterDateStatus,
      locationName: inferredPlace,
      latitude: firstAssetWithDate?.latitude || null,
      longitude: firstAssetWithDate?.longitude || null,
      people: inferredPeople,
      topics: inferredTopics,
      mood: inferredMood,
      photoCount: clusterAssets.length,
      confidence: 0.9,
      status: 'pending',
      assets: clusterAssets,
      createdAt: new Date().toISOString(),
    })
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

  // 1. Tags & embedding
  const [tags, embedding] = await Promise.all([
    tagMemory(effectiveBody).catch(() => ({
      place: '',
      people: [],
      topics: ['past photos', 'rediscover'],
      mood: 'reflective',
      summary: effectiveBody.slice(0, 100),
      memory_type: 'moment',
    })),
    embedText(effectiveBody).catch(() => null),
  ])

  const finalTopics = topics.length > 0 ? topics : tags.topics
  const finalPeople = people.length > 0 ? people : tags.people
  const finalPlace = place.trim() || tags.place
  const finalMood = mood || tags.mood || 'reflective'

  // 2. Insert into memories
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
      summary: tags.summary || effectiveBody.slice(0, 120),
      memory_type: 'moment',
      mood: finalMood,
      embedding,
    })
    .select()
    .single()

  if (memError || !memoryData) throw new Error(memError?.message || 'Could not save memory.')

  // 3. Attach media with source_type = 'past_import'
  const mediaAssets: MediaAsset[] = []
  for (const path of storagePaths) {
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

    const { data: signed } = await supabase.storage.from('memory-photos').createSignedUrl(path, 3600)

    mediaAssets.push({
      id: mRow?.id || `${Date.now()}`,
      url: signed?.signedUrl || '',
      storagePath: path,
      mediaType: 'image',
      fileName,
      fileSize: 150000,
      createdAt: mRow?.created_at || new Date().toISOString(),
      sourceType: 'past_import',
    })
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
  }
}

export async function fetchRediscoveredMemories(): Promise<Memory[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: mediaItems } = await supabase
    .from('media')
    .select('memory_id')
    .eq('user_id', user.id)
    .eq('source_type', 'past_import')

  if (!mediaItems || mediaItems.length === 0) return []

  const memoryIds = Array.from(new Set(mediaItems.map((m) => m.memory_id).filter(Boolean)))
  if (memoryIds.length === 0) return []

  const allMemories = await fetchMemories()
  return allMemories.filter((m) => memoryIds.includes(m.id))
}


