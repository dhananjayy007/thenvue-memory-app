import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { searchSemanticMemories } from '@/lib/ai/search-memories'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await authenticatedClient(request)
  if (auth instanceof NextResponse) return auth

  const url = new URL(request.url)
  const query = url.searchParams.get('q') || ''
  const limitParam = url.searchParams.get('limit')
  const thresholdParam = url.searchParams.get('threshold')

  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 10), 50) : 10
  const threshold = thresholdParam ? Math.max(0, Math.min(1, parseFloat(thresholdParam) || 0)) : 0.0

  if (!query.trim()) {
    return NextResponse.json({ query: '', results: [] })
  }

  try {
    const results = await searchSemanticMemories({
      client: auth.client,
      query,
      limit,
      threshold,
    })

    return NextResponse.json({
      query,
      count: results.length,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed.' },
      { status: 500 }
    )
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
