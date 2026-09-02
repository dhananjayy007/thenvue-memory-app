'use client'

import { Camera, PenLine } from 'lucide-react'
import type { Memory } from '@/types/memory'
import { fmt, isSameCalendarDay } from '@/lib/format'
import { renderWithMentions } from '@/lib/mentions'

export function MemoryCard({
  memory,
  onClick,
  onAddPhoto,
}: {
  memory: Memory
  onClick: () => void
  onAddPhoto?: (memory: Memory) => void
}) {
  const isToday = isSameCalendarDay(memory.date)

  return (
    <div className="memory-card-wrapper">
      <div
        role="button"
        tabIndex={0}
        className="memory-card"
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        {memory.media[0] ? (
          <img src={memory.media[0].url} alt={memory.media[0].fileName} />
        ) : (
          <div className="card-placeholder">
            <PenLine size={16} />
          </div>
        )}
        <div className="card-copy">
          <div className="card-copy-header">
            <span>{fmt(memory.date)}</span>
            {onAddPhoto && (
              <button
                type="button"
                className="card-camera-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddPhoto(memory)
                }}
                title="Add photo to this memory"
                aria-label="Add photo to this memory"
              >
                <Camera size={14} />
              </button>
            )}
          </div>
          <strong>{renderWithMentions(memory.title)}</strong>
          <small>
            {memory.place} · {memory.topics[0] ?? 'Uncategorized'}
          </small>
        </div>
      </div>
    </div>
  )
}
