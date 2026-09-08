import type { Memory, MemoryType, ConnectedMemory, AskAnswer, AskSourceMemory } from '../types/memory'
import { supabase } from './supabase'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://thenvue.com'

export type TagResult = {
  title: string
  place: string
  people: string[]
  topics: string[]
  mood: string
  memoryType: MemoryType
  summary: string
}

async function callAiProxy(action: string, payload: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_BASE_URL}/api/v1/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  })

  if (!res.ok) {
    throw new Error(`AI proxy error (${res.status})`)
  }
  return res.json()
}

export async function tagMemory(text: string): Promise<TagResult> {
  try {
    const data = await callAiProxy('tag', { text })
    return {
      title: data.title || text.slice(0, 30),
      place: data.place || '',
      people: Array.isArray(data.people) ? data.people : [],
      topics: Array.isArray(data.topics) ? data.topics : [],
      mood: data.mood || 'calm',
      memoryType: ['note', 'moment', 'story', 'reflection'].includes(data.memoryType)
        ? data.memoryType
        : 'moment',
      summary: data.summary || '',
    }
  } catch (err) {
    console.warn('AI Tagging proxy fallback:', err)
    return {
      title: text.slice(0, 30),
      place: '',
      people: [],
      topics: [],
      mood: 'calm',
      memoryType: 'moment',
      summary: '',
    }
  }
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
  try {
    const data = await callAiProxy('transcribe', { audioBase64: base64Data, mimeType })
    return data.transcript || ''
  } catch (err) {
    console.error('Transcription error:', err)
    return ''
  }
}

export async function embedText(text: string): Promise<number[] | null> {
  try {
    const data = await callAiProxy('embed', { text })
    return data.embedding || null
  } catch (err) {
    console.error('Embedding proxy error:', err)
    return null
  }
}

export type ConversationTurn = {
  question: string
  answer: string
}

export type AskMyLifeResult = {
  query: string
  answer: string
  sources: Memory[]
}

export async function askMyLife(
  question: string,
  memories: Memory[] = [],
  history: ConversationTurn[] = []
): Promise<AskMyLifeResult> {
  try {
    const data = await callAiProxy('ask', { question, history })
    return {
      query: data.query || question,
      answer: data.answer || "I couldn't find an answer.",
      sources: Array.isArray(data.sources) ? data.sources : [],
    }
  } catch (err) {
    console.warn('askMyLife proxy error, running client fallback:', err)
    return {
      query: question,
      answer: "I couldn't process your question right now. Please try again.",
      sources: [],
    }
  }
}

export async function searchSemanticMemoriesApi(
  query: string,
  limit = 20,
  threshold = 0.2
): Promise<Memory[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return []

    const res = await fetch(
      `${API_BASE_URL}/api/v1/memories/search?q=${encodeURIComponent(trimmed)}&limit=${limit}&threshold=${threshold}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!res.ok) {
      console.warn(`Semantic search error status: ${res.status}`)
      return []
    }

    const data = await res.json()
    const results = Array.isArray(data.results) ? data.results : []
    return results
  } catch (err) {
    console.warn('Semantic search fetch error:', err)
    return []
  }
}

