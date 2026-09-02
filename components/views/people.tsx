import { ChevronRight, Users } from 'lucide-react'
import type { Memory } from '@/types/memory'
import { PageIntro } from '@/components/shared/page-intro'
import { fmt } from '@/lib/format'

function summarizePeople(memories: Memory[]) {
  const byName = new Map<string, Memory[]>()
  for (const m of memories) {
    for (const person of m.people) {
      if (!byName.has(person)) byName.set(person, [])
      byName.get(person)!.push(m)
    }
  }
  return [...byName.entries()]
    .map(([name, ms]) => ({
      name,
      memories: ms,
      lastSeen: ms.reduce((latest, m) => (m.date > latest ? m.date : latest), ms[0].date),
    }))
    .sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1))
}

export function People({
  memories,
  onOpen,
  onCapture,
}: {
  memories: Memory[]
  onOpen: (m: Memory) => void
  onCapture?: () => void
}) {
  const people = summarizePeople(memories)

  return (
    <div className="page">
      <PageIntro
        eyebrow="The people in your story"
        title="People"
        description="Memories gathered around the people who matter."
      />
      {people.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Users size={22} />
          </div>
          <h3>No people mentioned yet</h3>
          <p>The people in your memories will appear here automatically when you mention their names.</p>
          {onCapture && (
            <button type="button" className="voice-action-btn" onClick={onCapture}>
              Capture a memory
            </button>
          )}
        </div>
      ) : (
        <div className="people-list">
          {people.map(({ name, memories: ms, lastSeen }, i) => (
            <button className="person-card" key={name} onClick={() => onOpen(ms[0])}>
              <div className={`person-avatar p${i % 4}`}>{name[0]?.toUpperCase()}</div>
              <div>
                <h2>{name}</h2>
                <p>
                  {ms.length} {ms.length === 1 ? 'memory' : 'memories'}
                </p>
                <small>Last seen · {fmt(lastSeen)}</small>
              </div>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
