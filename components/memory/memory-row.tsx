'use client'

import { Camera, ChevronRight, MapPin } from 'lucide-react'
import type { Memory } from '@/types/memory'
import { isSameCalendarDay } from '@/lib/format'
import { renderWithMentions } from '@/lib/mentions'

export function MemoryRow({
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

  return (
    <div className="memory-row-wrapper">
      <div
        role="button"
        tabIndex={0}
        className="memory-row"
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        <span className="row-time">{memory.time}</span>
        <span className="row-content">
          <strong>{renderWithMentions(memory.text)}</strong>
          <small>
            <MapPin size={12} /> {memory.place} <i /> {memory.topics[0] ?? 'Uncategorized'}
          </small>
        </span>
        {photo && <img src={photo.url} alt={photo.fileName} />}
        {onAddPhoto && (
          <button
            type="button"
            className="row-camera-btn"
            onClick={(e) => {
              e.stopPropagation()
              onAddPhoto(memory)
            }}
            title="Add photo to this memory"
            aria-label="Add photo to this memory"
          >
            <Camera size={15} />
          </button>
        )}
        <ChevronRight size={15} />
      </div>
    </div>
  )
}
