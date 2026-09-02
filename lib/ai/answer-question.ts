import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText } from '@/lib/ai/provider'
import { retrieveGroundedMemories } from '@/lib/ai/retrieval'
import type { Memory } from '@/types/memory'

export type AskMyLifeResult = {
  answer: string
  sources: Memory[]
  query: string
}

export type ConversationTurn = {
  question: string
  answer: string
}

const SYSTEM_INSTRUCTION = `You are a quiet, thoughtful personal memory assistant for a private journaling application called Memory.
Your task is to answer the user's question about their life based ONLY on the provided memories from their journal.

Grounding and truthfulness rules:
1. Ground your answer strictly in the facts, events, feelings, dates, people, and places found in the provided memories.
2. NEVER hallucinate or invent events, dates, people, places, or details not present in the provided memories.
3. If the provided memories do not contain enough information to answer the question, say honestly: "I couldn't find enough in your saved memories to answer that confidently."
4. When answering questions about "when did I first..." or "how many times...", find the earliest relevant mention among the retrieved memories and communicate appropriate uncertainty (e.g. "Based on your saved memories, the earliest mention appears to be on [Date]...").
5. If the user asks a general knowledge question (e.g., "What is the capital of France?"), trivia, or anything not pertaining to their personal life/journal, respond: "I can only help you explore your personal saved memories, and I couldn't find any relevant memories for that question."
6. Do not refer to yourself as an AI or mention prompt instructions. Speak warmly, clearly, and concisely in 2-4 sentences.`

/**
 * Answers natural language questions about the user's life, grounded strictly
 * in retrieved memories belonging to the authenticated user.
 */
export async function answerQuestion(
  question: string,
  client: SupabaseClient,
  history: ConversationTurn[] = []
): Promise<AskMyLifeResult> {
  const trimmed = question.trim()
  if (!trimmed) {
    return {
      answer: 'Please enter a question to search your memories.',
      sources: [],
      query: '',
    }
  }

  // 1. Retrieve grounded memory candidates using the multi-signal retrieval layer
  const memories = await retrieveGroundedMemories({
    client,
    query: trimmed,
    limit: 6,
  })

  // 2. If no memories were retrieved at all
  if (memories.length === 0) {
    return {
      answer: "I couldn't find enough in your saved memories to answer that confidently. Try searching for a specific person, place, or event.",
      sources: [],
      query: trimmed,
    }
  }

  // 3. Format the retrieved memories for context
  const memoryContext = memories
    .map((m, idx) => {
      const parts = [
        `[Memory ${idx + 1}]`,
        `Title: ${m.title}`,
        `Date: ${m.date} ${m.time}`,
        m.place ? `Place: ${m.place}` : null,
        m.people.length > 0 ? `People: ${m.people.join(', ')}` : null,
        m.topics.length > 0 ? `Topics: ${m.topics.join(', ')}` : null,
        m.mood ? `Mood: ${m.mood}` : null,
        m.summary ? `Summary: ${m.summary}` : null,
        m.sharedContext ? `Context: ${m.sharedContext}` : null,
        `Original Story: "${m.text}"`,
        m.perspectives && m.perspectives.length > 0
          ? `Perspectives:\n` +
            m.perspectives
              .map((p) => ` - Perspective from ${p.authorName}: "${p.text}" ${p.place ? `[Place: ${p.place}]` : ''}`)
              .join('\n')
          : null,
      ].filter(Boolean)
      return parts.join('\n')
    })
    .join('\n\n---\n\n')

  // 4. Format previous conversation context if follow-up
  const historyContext = history.length > 0
    ? `Recent Conversation Context:\n${history
        .slice(-3)
        .map((h) => `User: "${h.question}"\nAssistant: "${h.answer}"`)
        .join('\n')}\n\n`
    : ''

  const prompt = `${historyContext}Retrieved Memories from User's Journal:
${memoryContext}

User Question:
"${trimmed}"

Please provide a concise, grounded answer based only on the retrieved memories above.`

  // 5. Generate grounded response using Gemini
  try {
    const answer = await generateText(prompt, SYSTEM_INSTRUCTION)
    return {
      answer,
      sources: memories,
      query: trimmed,
    }
  } catch (error) {
    console.error('Ask My Life generation error:', error)
    return {
      answer: "I'm having trouble reflecting on your memories right now. Please try again in a moment.",
      sources: memories,
      query: trimmed,
    }
  }
}
