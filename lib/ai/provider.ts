import { GoogleGenAI } from '@google/genai'

// This is the ONLY file that imports the Gemini SDK directly. Every other
// file in the app calls the functions in tag-memory.ts / embed-memory.ts /
// answer-question.ts, so swapping providers later means rewriting this file
// (and those three), not the app.

// Models are read from env so an upgrade (e.g. a newer Flash release) never
// needs a code change. Defaults are current, cost-effective, generally
// available Gemini models as of August 2026 -- verify at
// https://ai.google.dev/gemini-api/docs/models before assuming these are
// still current if this code is running much later.
export const TAG_MODEL = process.env.GEMINI_TAG_MODEL || 'gemini-3.6-flash'
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2'

// gemini-embedding-2 supports configurable output size; 768 keeps the
// pgvector column small and fast while still being plenty for semantic
// search over short personal journal entries.
export const EMBEDDING_DIMENSIONS = 768

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (client) return client
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.')
  client = new GoogleGenAI({ apiKey })
  return client
}

/**
 * Calls the model with a JSON schema and returns the parsed, typed result.
 * Throws if the call fails or the response isn't valid JSON -- callers
 * decide what fallback behavior makes sense for their use case.
 */
export async function generateStructured<T>(prompt: string, schema: object): Promise<T> {
  const response = await getClient().models.generateContent({
    model: TAG_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  })

  const text = response.text
  if (!text) throw new Error('Empty response from AI provider.')
  return JSON.parse(text) as T
}

/** Returns a single embedding vector for the given text. */
export async function embedText(text: string): Promise<number[]> {
  const response = await getClient().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  })

  const values = response.embeddings?.[0]?.values
  if (!values || values.length === 0) throw new Error('Empty embedding from AI provider.')
  return values
}

/**
 * Generates natural language text using the configured Gemini model.
 * Used by Ask My Life to formulate answers grounded in retrieved memories.
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const response = await getClient().models.generateContent({
    model: TAG_MODEL,
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  })

  const text = response.text
  if (!text) throw new Error('Empty response from AI provider.')
  return text.trim()
}

/**
 * Transcribes an audio recording using Gemini multimodal input.
 * Returns the exact verbatim speech transcript.
 */
export async function transcribeAudio(base64Data: string, mimeType = 'audio/webm'): Promise<string> {
  const response = await getClient().models.generateContent({
    model: TAG_MODEL,
    contents: [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      'Please accurately transcribe this personal audio memory word for word. Return ONLY the transcribed text. Do not add timestamps, speaker labels, or conversational responses.',
    ],
  })

  const text = response.text
  if (!text) throw new Error('Empty transcription from AI provider.')
  return text.trim()
}



