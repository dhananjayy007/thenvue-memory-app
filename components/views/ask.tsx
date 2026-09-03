'use client'

import { useState } from 'react'
import { ArrowRight, ChevronRight, RotateCcw, Send } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'
import type { Memory } from '@/types/memory'
import { PageIntro } from '@/components/shared/page-intro'
import { askMyLifeAction } from '@/app/memories/actions'
import type { AskMyLifeResult, ConversationTurn } from '@/lib/ai/answer-question'
import { fmt } from '@/lib/format'
import { FeatureTip } from '@/components/shared/feature-tip'

const SUGGESTED_QUESTIONS = [
  'When did I first mention wanting to change jobs?',
  'What trips did I take with Rahul?',
  'What was I doing this time last year?',
  'Show me my happiest memories from 2026.',
  'What places have I visited most?',
]

export function Ask({
  memories: _allMemories,
  ask: controlledAsk,
  setAsk: setControlledAsk,
  answer: _answerProp,
  setAnswer: _setAnswerProp,
  onOpen,
}: {
  memories: Memory[]
  ask: string
  setAsk: (v: string) => void
  answer: boolean
  setAnswer: (v: boolean) => void
  onOpen: (m: Memory) => void
}) {
  const [question, setQuestion] = useState(controlledAsk || '')
  const [loading, setLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<AskMyLifeResult | null>(null)
  const [history, setHistory] = useState<ConversationTurn[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleAsk = async (queryToSubmit?: string) => {
    const q = (queryToSubmit ?? question).trim()
    if (!q || loading) return

    setLoading(true)
    setError(null)
    setQuestion('')
    setControlledAsk('')

    try {
      const result = await askMyLifeAction(q, history)
      setCurrentResult(result)
      setHistory((prev) => [...prev, { question: q, answer: result.answer }])
    } catch (err) {
      console.error('Ask My Life failed:', err)
      setError('Could not search your memories right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentResult(null)
    setHistory([])
    setQuestion('')
    setError(null)
  }

  return (
    <div className="page ask-page">
      <PageIntro
        eyebrow="A quiet memory assistant"
        title="Ask your life"
        description="Search your life through questions, grounded in your saved memories."
      />

      <FeatureTip
        storageKey="ask_page_intro"
        icon={<CustomBrainIcon size={16} />}
        title="Ask Your Memory Private AI"
        description="Search your moments by concept, feeling, or people (e.g., 'trips with Rahul' or 'times I felt at peace')."
        secondaryActionLabel="Got it"
      />

      <div className="ask-box">
        <CustomBrainIcon size={18} />
        <input
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value)
            setControlledAsk(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              handleAsk()
            }
          }}
          disabled={loading}
          placeholder="What do you want to remember?"
        />
        <button
          aria-label="Ask"
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          style={{ opacity: loading || !question.trim() ? 0.6 : 1 }}
        >
          <Send size={16} />
        </button>
      </div>

      {!currentResult && !loading && (
        <div className="suggested">
          <p>Try asking</p>
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuestion(q)
                setControlledAsk(q)
                handleAsk(q)
              }}
            >
              {q}
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="answer">
          <div className="answer-label">
            <CustomBrainIcon size={15} /> Reflecting on your memories...
          </div>
          <p className="answer-note" style={{ marginTop: 12 }}>
            Searching your timeline and retrieving relevant moments...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="answer">
          <p className="auth-error">{error}</p>
        </div>
      )}

      {currentResult && !loading && (
        <div className="answer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="answer-label">
              <CustomBrainIcon size={15} /> Remembered for you
            </div>

            <button
              onClick={handleReset}
              className="text-button"
              style={{ fontSize: 11, color: 'var(--muted-foreground)' }}
            >
              <RotateCcw size={12} /> New question
            </button>
          </div>

          <p className="subhead" style={{ fontStyle: 'italic', fontSize: 14, margin: '8px 0 14px' }}>
            &ldquo;{currentResult.query}&rdquo;
          </p>

          <h2 style={{ whiteSpace: 'pre-line' }}>{currentResult.answer}</h2>

          <p className="answer-note">
            {currentResult.sources.length > 0
              ? `Based on ${currentResult.sources.length} ${
                  currentResult.sources.length === 1 ? 'source memory' : 'source memories'
                } · click any memory to inspect`
              : 'Grounded in your private timeline'}
          </p>

          {currentResult.sources.length > 0 && (
            <div className="supporting">
              {currentResult.sources.map((m) => (
                <button key={m.id} onClick={() => onOpen(m)}>
                  <div style={{ width: 110, flexShrink: 0 }}>
                    <span>{fmt(m.date)}</span>
                    {m.place && (
                      <small style={{ display: 'block', fontSize: 9, color: 'var(--muted-foreground)' }}>
                        {m.place}
                      </small>
                    )}
                  </div>
                  <strong style={{ flex: 1, minWidth: 0 }}>&ldquo;{m.text}&rdquo;</strong>
                  {m.media.length > 0 && (
                    <img
                      src={m.media[0].url}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          )}

          {history.length > 1 && (
            <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <p className="eyebrow" style={{ fontSize: 9 }}>
                Conversation History
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                {history.slice(0, -1).map((h, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    <strong>Q: {h.question}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 11 }}>{h.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
