'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import type { Memory } from '@/types/memory'
import { PageIntro } from '@/components/shared/page-intro'
import { MemoryRow } from '@/components/memory/memory-row'

export function Timeline({
  memories,
  onOpen,
  query,
  setQuery,
  onCapture,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  memories: Memory[]
  onOpen: (m: Memory) => void
  query: string
  setQuery: (v: string) => void
  onCapture?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'photos' | 'places' | 'people'>('all')
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const visibleMemories = useMemo(() => {
    let list = memories
    if (filter === 'photos') list = list.filter((memory) => memory.media.length > 0)
    if (filter === 'places') list = list.filter((memory) => Boolean(memory.place))
    if (filter === 'people') list = list.filter((memory) => memory.people.length > 0)

    // Strict reverse chronological sort by date (YYYY-MM-DD) and time
    return [...list].sort((a, b) => {
      const dateDiff = (b.date || '').localeCompare(a.date || '')
      if (dateDiff !== 0) return dateDiff
      return (b.time || '').localeCompare(a.time || '')
    })
  }, [filter, memories])

  // Extract unique months and sort them in strict descending order (e.g. 2026-09, 2026-08, 2025-01)
  const months = useMemo(() => {
    const monthSet = new Set<string>()
    for (const m of visibleMemories) {
      if (m.date && m.date.length >= 7) {
        monthSet.add(m.date.slice(0, 7))
      }
    }
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a))
  }, [visibleMemories])

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoadingMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(sentinel)
    return () => {
      observer.disconnect()
    }
  }, [hasMore, onLoadMore, isLoadingMore])

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
        <>
          {months.map((month) => (
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
          ))}

          {/* Infinite Scroll Sentinel & Loader */}
          {hasMore && (
            <div ref={sentinelRef} className="py-6 flex items-center justify-center text-sm text-neutral-400 gap-2">
              {isLoadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading earlier moments...</span>
                </>
              ) : (
                <span className="opacity-0">Scroll for more</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

