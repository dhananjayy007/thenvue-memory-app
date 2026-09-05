'use client'

import { Camera, PenLine, Mic, Volume2 } from 'lucide-react'
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

  const photo = memory.media.find((m) => m.mediaType === 'image' || m.mediaType === 'document')
  const hasAudio = memory.media.some((m) => m.mediaType === 'audio')

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
        {photo ? (
          <img src={photo.url} alt={photo.fileName || memory.title} loading="lazy" decoding="async" />
        ) : hasAudio ? (
          <div className="card-placeholder card-audio-placeholder">
            <div className="card-audio-visual">
              <Mic size={18} className="card-audio-mic" />
              <div className="card-audio-waves">
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
              </div>
            </div>
          </div>
        ) : (
          <div className="card-placeholder card-text-placeholder">
            <div className="card-text-visual">
              <PenLine size={18} className="card-text-pen" />
              <div className="card-text-lines">
                <span className="text-line-bar" />
                <span className="text-line-bar" />
                <span className="text-line-bar" />
              </div>
            </div>
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
