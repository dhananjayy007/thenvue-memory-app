import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { embedText, transcribeAudio } from '@/lib/ai/provider'
import { tagMemory } from '@/lib/ai/tag-memory'
import { answerQuestion } from '@/lib/ai/answer-question'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await authenticatedClient(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'tag') {
      const text = typeof body.text === 'string' ? body.text : ''
      const tags = await tagMemory(text)
      return NextResponse.json({
        title: tags.summary ? tags.summary.slice(0, 30) : text.slice(0, 30),
        place: tags.places[0] || '',
        people: tags.people || [],
        topics: tags.topics || [],
        mood: tags.mood || 'calm',
        memoryType: tags.memoryType || 'moment',
        summary: tags.summary || '',
      })
    }

    if (action === 'embed') {
      const text = typeof body.text === 'string' ? body.text : ''
      try {
        const values = await embedText(text.slice(0, 8000))
        return NextResponse.json({ embedding: values })
      } catch {
        return NextResponse.json({ embedding: null })
      }
    }

    if (action === 'transcribe') {
      const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : ''
      const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'audio/webm'
      try {
        const transcript = await transcribeAudio(audioBase64, mimeType)
        return NextResponse.json({ transcript })
      } catch (err) {
        console.error('Mobile transcribe proxy error:', err)
        return NextResponse.json({ transcript: '' })
      }
    }

    if (action === 'ask') {
      const question = typeof body.question === 'string' ? body.question : ''
      const result = await answerQuestion(question, auth.client)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
  } catch (error: any) {
    console.error('AI route error:', error)
    return NextResponse.json({ error: error?.message || 'AI request failed' }, { status: 500 })
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
