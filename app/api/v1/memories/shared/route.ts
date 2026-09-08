import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import type { Memory, MediaAsset, MemoryPerspective } from '@/types/memory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const memoryId = url.searchParams.get('id')

  if (!memoryId || !memoryId.trim()) {
    return NextResponse.json({ error: 'Memory ID is required.' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  // Create client with user authorization if token is provided, or anon client
  const authHeader = request.headers.get('authorization')
  const client = createClient(supabaseUrl, supabaseKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  })

  try {
    // 1. Fetch memory record
    const { data: mem, error: memErr } = await client
      .from('memories')
      .select('id, user_id, title, body, occurred_on, occurred_time, place, people, topics, summary, memory_type, mood')
      .eq('id', memoryId.trim())
      .is('deleted_at', null)
      .maybeSingle()

    if (memErr || !mem) {
      return NextResponse.json({ error: 'Memory not found or access denied.' }, { status: 404 })
    }

    // 2. Fetch author profile
    let authorName = 'A friend'
    if (mem.user_id) {
      const { data: profile } = await client
        .from('profiles')
        .select('display_name')
        .eq('id', mem.user_id)
        .maybeSingle()
      if (profile?.display_name?.trim()) {
        authorName = profile.display_name.trim()
      }
    }

    // 3. Fetch media with signed URLs
    const { data: mediaRows } = await client
      .from('media')
      .select('id, storage_path, media_type, file_name, file_size, created_at')
      .eq('memory_id', mem.id)

    const mediaAssets: MediaAsset[] = []
    if (mediaRows && mediaRows.length > 0) {
      for (const m of mediaRows) {
        const bucket = m.media_type === 'audio' ? 'memory-audio' : 'memory-photos'
        const { data: signedData } = await client.storage
          .from(bucket)
          .createSignedUrl(m.storage_path, 60 * 60 * 24)

        mediaAssets.push({
          id: m.id,
          storagePath: m.storage_path,
          mediaType: m.media_type,
          fileName: m.file_name || 'media',
          fileSize: m.file_size || 0,
          url: signedData?.signedUrl || '',
        })
      }
    }

    // 4. Fetch perspectives
    const { data: persRows } = await client
      .from('memory_perspectives')
      .select('id, memory_id, user_id, author_name, body, place, people, topics, mood, summary, memory_type, created_at, updated_at')
      .eq('memory_id', mem.id)

    const perspectives: MemoryPerspective[] = (persRows || []).map((p) => ({
      id: p.id,
      memoryId: p.memory_id,
      userId: p.user_id,
      authorName: p.author_name || authorName,
      text: p.body || '',
      place: p.place || '',
      people: p.people || [],
      topics: p.topics || [],
      mood: p.mood || '',
      summary: p.summary || '',
      memoryType: p.memory_type || 'perspective',
      media: [],
      savedToPersonalMemory: false,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }))

    const memory: Memory = {
      id: mem.id,
      userId: mem.user_id,
      title: mem.title || 'Shared Moment',
      text: mem.body || '',
      date: mem.occurred_on,
      time: mem.occurred_time?.slice(0, 5) || '12:00',
      place: mem.place || '',
      people: mem.people || [],
      topics: mem.topics || [],
      summary: mem.summary || '',
      memoryType: mem.memory_type || 'moment',
      mood: mem.mood || 'calm',
      media: mediaAssets,
      perspectives,
      isOwner: false,
    }

    return NextResponse.json({ memory, authorName })
  } catch (error: any) {
    console.error('Shared memory fetch error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve shared memory.' },
      { status: 500 }
    )
  }
}
