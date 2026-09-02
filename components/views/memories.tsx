'use client'

import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import type { Memory } from '@/types/memory'
import { PageIntro } from '@/components/shared/page-intro'
import { MemoryCard } from '@/components/memory/memory-card'

export function Memories({
  memories,
  onOpen,
  query,
  setQuery,
  onCapture,
  focusTrigger,
}: {
  memories: Memory[]
  onOpen: (m: Memory) => void
  query: string
  setQuery: (v: string) => void
  onCapture?: () => void
  focusTrigger?: number
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (focusTrigger !== undefined && focusTrigger > 0) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [focusTrigger])

  return (
    <div className="page">
      <PageIntro
        eyebrow="Everything you have kept"
        title="Memories"
        description="The small and important moments, together."
      />
      <div className="search-input wide" onClick={() => inputRef.current?.focus()}>
        <Search size={16} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by words, people, places..."
        />
      </div>

      {memories.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Search size={22} />
          </div>
          {query ? (
            <>
              <h3>No memories found</h3>
              <p>We couldn't find any memories matching &ldquo;{query}&rdquo;. Try searching for different words, a person, a place, or a broader phrase.</p>
              <button type="button" className="voice-action-btn voice-action-secondary" onClick={() => setQuery('')}>
                Clear search
              </button>
            </>
          ) : (
            <>
              <h3>No memories captured yet</h3>
              <p>Capture your first memory to begin gathering the moments that make up your life.</p>
              {onCapture && (
                <button type="button" className="voice-action-btn" onClick={onCapture}>
                  Capture a memory
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="memory-grid all-memories">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} onClick={() => onOpen(m)} />
          ))}
        </div>
      )}
    </div>
  )
}
