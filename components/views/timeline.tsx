'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Memory } from '@/types/memory'
import { PageIntro } from '@/components/shared/page-intro'
import { MemoryRow } from '@/components/memory/memory-row'

export function Timeline({
  memories,
  onOpen,
  query,
  setQuery,
  onCapture,
}: {
  memories: Memory[]
  onOpen: (m: Memory) => void
  query: string
  setQuery: (v: string) => void
  onCapture?: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'photos' | 'places' | 'people'>('all')
  const visibleMemories = useMemo(() => {
    if (filter === 'photos') return memories.filter((memory) => memory.media.length > 0)
    if (filter === 'places') return memories.filter((memory) => Boolean(memory.place))
    if (filter === 'people') return memories.filter((memory) => memory.people.length > 0)
    return memories
  }, [filter, memories])
  const months = [...new Set(visibleMemories.map((m) => m.date.slice(0, 7)))]

  return (
    <div className="page">
      <PageIntro
        eyebrow="Your life, in order"
        title="Your timeline"
        description="Browse the moments that make up your life."
      />
      <div className="filter-bar">
        <div className="search-input">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories..."
          />
        </div>
        <div className="filter-pills">
          {([
            ['all', 'All'],
            ['photos', 'Photos'],
            ['places', 'Places'],
            ['people', 'People'],
          ] as const).map(([value, label]) => (
            <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {visibleMemories.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Search size={22} />
          </div>
          {query ? (
            <>
              <h3>No matching timeline moments</h3>
              <p>We couldn't find any moments matching &ldquo;{query}&rdquo;. Try another search term or switch filters.</p>
              <button type="button" className="voice-action-btn voice-action-secondary" onClick={() => setQuery('')}>
                Clear search
              </button>
            </>
          ) : filter !== 'all' ? (
            <>
              <h3>No moments found with {filter}</h3>
              <p>None of your saved memories currently match the &ldquo;{filter}&rdquo; filter.</p>
              <button type="button" className="voice-action-btn voice-action-secondary" onClick={() => setFilter('all')}>
                Show all moments
              </button>
            </>
          ) : (
            <>
              <h3>Your timeline is waiting</h3>
              <p>Capture your first memory to begin building a chronological record of your moments.</p>
              {onCapture && (
                <button type="button" className="voice-action-btn" onClick={onCapture}>
                  Capture a memory
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        months.map((month) => (
          <section className="timeline-month" key={month}>
            <h2>
              {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
                new Date(`${month}-01T12:00:00`)
              )}
            </h2>
            <div>
              {visibleMemories
                .filter((m) => m.date.startsWith(month))
                .map((m) => (
                  <MemoryRow key={m.id} memory={m} onClick={() => onOpen(m)} />
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
