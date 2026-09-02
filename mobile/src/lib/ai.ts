import type { Memory, MemoryType, ConnectedMemory, AskAnswer, AskSourceMemory } from '../types/memory'
import { supabase } from './supabase'

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''
const GEMINI_PRIMARY_MODEL = 'gemini-3.5-flash'
const GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite'
const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-2'

export type TagResult = {
  title: string
  place: string
  people: string[]
  topics: string[]
  mood: string
  memoryType: MemoryType
  summary: string
}

function extractGeminiText(json: any): string {
  const parts = json.candidates?.[0]?.content?.parts || []
  const textParts = parts.filter((p: any) => p.text && !p.thought).map((p: any) => p.text)
  if (textParts.length > 0) return textParts.join('\n').trim()
  return parts[0]?.text?.trim() || ''
}

async function callGemini(contents: any[], generationConfig?: any): Promise<string> {
  const models = [GEMINI_PRIMARY_MODEL, GEMINI_FALLBACK_MODEL, 'gemini-3.1-flash-lite']
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig }),
        }
      )
      if (res.status === 200) {
        const json = await res.json()
        const text = extractGeminiText(json)
        if (text) return text
      }
    } catch (err) {
      console.warn(`Model ${model} error:`, err)
    }
  }
  return ''
}

export async function tagMemory(text: string): Promise<TagResult> {
  const prompt = `Analyze this personal memory and return JSON matching the schema below.
Memory: """${text.slice(0, 4000)}"""

Respond with raw JSON only (no markdown code fences):
{
  "title": "short descriptive title (3-6 words)",
  "place": "specific place or city mentioned, or empty string",
  "people": ["names of people mentioned, empty array if none"],
  "topics": ["1-4 relevant themes or topics"],
  "mood": "dominant emotion (e.g. nostalgic, joyful, calm, reflective, energetic, tired)",
  "memoryType": "note" | "moment" | "story" | "reflection",
  "summary": "1-2 sentence concise summary written in third-person"
}`

  try {
    const raw = await callGemini([{ parts: [{ text: prompt }] }], { responseMimeType: 'application/json' })
    if (raw) {
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(clean)
      return {
        title: String(parsed.title || text.slice(0, 30)),
        place: String(parsed.place || ''),
        people: Array.isArray(parsed.people) ? parsed.people.map(String) : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics.map(String) : [],
        mood: String(parsed.mood || 'calm'),
        memoryType: ['note', 'moment', 'story', 'reflection'].includes(parsed.memoryType)
          ? parsed.memoryType
          : 'moment',
        summary: String(parsed.summary || ''),
      }
    }
  } catch (err) {
    console.warn('AI Tagging fallback:', err)
  }

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

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
  try {
    const text = await callGemini([
      {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: base64Data,
            },
          },
          {
            text: 'Transcribe this spoken voice recording accurately. Return only the verbatim transcription text without quotes or commentary.',
          },
        ],
      },
    ])
    return text || ''
  } catch (err) {
    console.error('Transcription error:', err)
    return ''
  }
}

export async function embedText(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${GEMINI_EMBEDDING_MODEL}`,
          content: { parts: [{ text: text.slice(0, 8000) }] },
          outputDimensionality: 768,
        }),
      }
    )
    const json = await response.json()
    return json.embedding?.values ?? null
  } catch (err) {
    console.error('Embedding error:', err)
    return null
  }
}

export async function askMyLife(question: string, memories: Memory[]): Promise<AskAnswer> {
  const queryVector = await embedText(question)
  let matchedMemories: Memory[] = []

  if (queryVector) {
    const { data } = await supabase.rpc('match_memories', {
      query_embedding: queryVector,
      match_threshold: 0.15,
      match_count: 10,
    })
    if (data && data.length > 0) {
      const matchMap = new Map(data.map((row: any) => [row.id, row.similarity]))
      matchedMemories = memories
        .filter((m) => matchMap.has(m.id))
        .map((m) => ({ ...m, similarity: matchMap.get(m.id) }))
    }
  }

  if (matchedMemories.length === 0) {
    const q = question.toLowerCase()
    matchedMemories = memories
      .filter((m) => `${m.text} ${m.place} ${m.people.join(' ')} ${m.topics.join(' ')}`.toLowerCase().includes(q))
      .slice(0, 5)
  }

  const memoryContext = matchedMemories
    .map(
      (m, idx) =>
        `[${idx + 1}] Date: ${m.date} | Place: ${m.place || 'Unknown'} | People: ${m.people.join(', ') || 'None'}\nMemory: "${m.text}"`
    )
    .join('\n\n')

  const prompt = `You are a private personal memory assistant. You ONLY have access to the user's recorded memories provided below.
Rules:
1. Answer the user's question directly based ONLY on the memories.
2. If the memories do not contain the answer, say "I don't have any saved memories about that yet."
3. Do NOT invent facts, general trivia, or answer questions outside the user's personal memories.
4. Keep the tone warm, concise, and helpful.

Saved Memories:
${memoryContext || 'No relevant memories found.'}

Question: "${question}"`

  try {
    const answer = await callGemini([{ parts: [{ text: prompt }] }])
    const finalAnswer = answer || "I couldn't find an answer in your saved memories."

    const sourceMemories: AskSourceMemory[] = matchedMemories.map((m) => ({
      id: m.id,
      date: m.date,
      title: m.title,
      text: m.text,
      place: m.place,
      people: m.people,
      topics: m.topics,
      media: m.media,
      similarity: (m as any).similarity || 0.8,
    }))

    return {
      question,
      answer: finalAnswer,
      grounded: matchedMemories.length > 0,
      sourceMemories,
    }
  } catch (err) {
    return {
      question,
      answer: "I couldn't process your question right now. Please try again.",
      grounded: false,
      sourceMemories: [],
    }
  }
}
