import { ChevronRight, MapPin } from 'lucide-react'
import type { Memory } from '@/types/memory'
import { PageIntro } from '@/components/shared/page-intro'

function summarizePlaces(memories: Memory[]) {
  const byPlace = new Map<string, Memory[]>()
  for (const m of memories) {
    if (!m.place) continue
    if (!byPlace.has(m.place)) byPlace.set(m.place, [])
    byPlace.get(m.place)!.push(m)
  }
  return [...byPlace.entries()]
    .map(([place, ms]) => ({ place, memories: ms }))
    .sort((a, b) => b.memories.length - a.memories.length)
}

export function Places({
  memories,
  onOpen,
  onCapture,
}: {
  memories: Memory[]
  onOpen: (m: Memory) => void
  onCapture?: () => void
}) {
  const places = summarizePlaces(memories)

  return (
    <div className="page">
      <PageIntro
        eyebrow="The places that hold a memory"
        title="Places"
        description="A map of where your life has happened."
      />
      <div className="place-layout">
        <div className="place-art">
          <MapPin size={30} />
          <span>
            {places.length} {places.length === 1 ? 'place' : 'places'}
            <br />
            remembered
          </span>
        </div>
        {places.length === 0 ? (
          <div className="empty-state-card" style={{ margin: 0 }}>
            <div className="empty-state-icon">
              <MapPin size={22} />
            </div>
            <h3>No places remembered yet</h3>
            <p>The places connected to your memories will appear here as you log locations.</p>
            {onCapture && (
              <button type="button" className="voice-action-btn" onClick={onCapture}>
                Capture a memory
              </button>
            )}
          </div>
        ) : (
          <div className="place-list">
            {places.map(({ place, memories: ms }) => (
              <button key={place} onClick={() => onOpen(ms[0])}>
                <span className="place-dot" />
                <div>
                  <strong>{place}</strong>
                  <small>
                    {ms.length} {ms.length === 1 ? 'memory' : 'memories'}
                  </small>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
