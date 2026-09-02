import { generateStructured } from '@/lib/ai/provider'

export type MemoryTags = {
  summary: string
  people: string[]
  places: string[]
  topics: string[]
  mood: string
  memoryType: string
}

const schema = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'One sentence summarizing what happened, written in third person.' },
    people: { type: 'array', items: { type: 'string' }, description: 'Names of people mentioned. Empty array if none.' },
    places: { type: 'array', items: { type: 'string' }, description: 'Places mentioned, most specific first. Empty array if none.' },
    topics: { type: 'array', items: { type: 'string' }, description: '2-5 short lowercase topic tags, e.g. "career", "friendship".' },
    mood: { type: 'string', description: 'One word describing the emotional tone, e.g. "reflective", "joyful", "anxious".' },
    memoryType: { type: 'string', description: 'One or two words categorizing the entry, e.g. "conversation", "milestone", "routine".' },
  },
  required: ['summary', 'people', 'places', 'topics', 'mood', 'memoryType'],
}

const FALLBACK: MemoryTags = {
  summary: '',
  people: [],
  places: [],
  topics: [],
  mood: 'Unsorted',
  memoryType: '',
}

/**
 * Extracts structured understanding from a memory's raw text. Never throws --
 * on any failure (missing API key, network error, malformed response) it
 * returns a safe empty fallback so saving a memory never depends on the AI
 * call succeeding.
 */
export async function tagMemory(text: string): Promise<MemoryTags> {
  try {
    const prompt = `Extract structured information from this personal journal entry. Only include people and places the person actually named -- never invent any.\n\nEntry:\n"""${text}"""`
    const result = await generateStructured<Partial<MemoryTags>>(prompt, schema)

    return {
      summary: typeof result.summary === 'string' ? result.summary.trim() : FALLBACK.summary,
      people: Array.isArray(result.people) ? result.people.filter((p): p is string => typeof p === 'string') : FALLBACK.people,
      places: Array.isArray(result.places) ? result.places.filter((p): p is string => typeof p === 'string') : FALLBACK.places,
      topics: Array.isArray(result.topics) ? result.topics.filter((t): t is string => typeof t === 'string') : FALLBACK.topics,
      mood: typeof result.mood === 'string' && result.mood.trim() ? result.mood.trim() : FALLBACK.mood,
      memoryType: typeof result.memoryType === 'string' ? result.memoryType.trim() : FALLBACK.memoryType,
    }
  } catch (error) {
    console.error('tagMemory failed, using fallback:', error instanceof Error ? error.message : error)
    return FALLBACK
  }
}
