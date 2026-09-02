'use client'

import { ArrowRight, Camera, Compass, Mic, PenLine, Film } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'
import type { Memory } from '@/types/memory'
import { SectionTitle } from '@/components/shared/section-title'
import { MemoryRow } from '@/components/memory/memory-row'
import { MemoryCard } from '@/components/memory/memory-card'
import { fmt, getTodayDateString } from '@/lib/format'

export function Home({
  memories,
  onCapture,
  onCaptureVoice,
  onOpen,
  onGo,
  onAddPhoto,
  displayName,
}: {
  memories: Memory[]
  onCapture: () => void
  onCaptureVoice?: () => void
  onOpen: (m: Memory) => void
  onGo: (v: string) => void
  onAddPhoto?: (m: Memory) => void
  displayName: string
}) {
  const now = new Date()
  const currentHour = now.getHours()
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  const currentYear = now.getFullYear()
  const todayISO = getTodayDateString()
  const monthDay = todayISO.slice(5)

  const sortedMemories = [...memories].sort((a, b) => {
    const dateDiff = (b.date || '').localeCompare(a.date || '')
    if (dateDiff !== 0) return dateDiff
    return (b.time || '').localeCompare(a.time || '')
  })

  const today = sortedMemories.filter((m) => m.date === todayISO)
  const recent = sortedMemories.slice(0, 6)

  // Find Rediscover memories (historical: year < currentYear)
  const historicalMemories = sortedMemories.filter((m) => parseInt(m.date.slice(0, 4), 10) < currentYear)

  // 1. Exact match On This Day
  const exactMatches = historicalMemories.filter((m) => m.date.slice(5) === monthDay)

  // 2. Around this time (+/- 7 days in past years)
  let rediscoverItem: { memory: Memory; headline: string; isExact: boolean } | null = null

  if (exactMatches.length > 0) {
    const mem = exactMatches[0]
    const yearsAgo = currentYear - parseInt(mem.date.slice(0, 4), 10)
    const headline = yearsAgo === 1 ? '1 year ago today' : `${yearsAgo} years ago today`
    rediscoverItem = { memory: mem, headline, isExact: true }
  } else if (historicalMemories.length > 0) {
    const refDayOfYear = getDayOfYear(now)
    const aroundMatches = historicalMemories.filter((m) => {
      const memDate = new Date(`${m.date}T12:00:00Z`)
      const memDayOfYear = getDayOfYear(memDate)
      const diff = Math.abs(memDayOfYear - refDayOfYear)
      const circularDiff = Math.min(diff, 365 - diff)
      return circularDiff <= 7
    })
    if (aroundMatches.length > 0) {
      const mem = aroundMatches[0]
      const yearsAgo = currentYear - parseInt(mem.date.slice(0, 4), 10)
      const headline = yearsAgo === 1 ? 'Around this time last year' : `Around this time ${yearsAgo} years ago`
      rediscoverItem = { memory: mem, headline, isExact: false }
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }).format(now)}
          </p>
          <h1>{greeting}, {displayName}.</h1>
          <p className="subhead">Your life, remembered for you</p>
        </div>
        <button className="outline-button reflection-button" onClick={() => onGo('ask')}>
          <CustomBrainIcon size={15} /> {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now)} reflection
        </button>
      </div>

      <button className="capture-prompt" onClick={onCapture}>
        <PenLine size={22} />
        <span>Write something you want to remember...</span>
        <ArrowRight size={17} />
      </button>
      <div className="quick-actions">
        <button onClick={onCapture}>
          <PenLine size={15} /> Write
        </button>
        <button onClick={onCaptureVoice || onCapture}>
          <Mic size={15} /> Speak
        </button>
        <button onClick={onCapture}>
          <Camera size={15} /> Add photo
        </button>
        <button onClick={() => onGo('rediscover')}>
          <Film size={15} /> Rediscover
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <CustomBrainIcon size={24} />
          </div>
          <h3>Your story starts here</h3>
          <p>Capture a thought, moment, photo, or voice memory to begin building your private timeline.</p>
          <button type="button" className="voice-action-btn" style={{ marginTop: 8 }} onClick={onCapture}>
            Capture your first memory
          </button>
        </div>
      ) : (
        <>
          {today.length > 0 && (
            <section className="section">
              <SectionTitle label="Today" action="See timeline" onClick={() => onGo('timeline')} />
              <div className="today-list">
                {today.map((m) => (
                  <MemoryRow key={m.id} memory={m} onClick={() => onOpen(m)} onAddPhoto={onAddPhoto} />
                ))}
              </div>
            </section>
          )}

          {rediscoverItem && (
            <section className="rediscover">
              <div>
                <p className="eyebrow">Rediscover</p>
                <h2>{rediscoverItem.headline}</h2>
                <p className="date-line">
                  {fmt(rediscoverItem.memory.date)}
                  {rediscoverItem.memory.place && ` · ${rediscoverItem.memory.place}`}
                </p>
                <blockquote>&ldquo;{rediscoverItem.memory.text}&rdquo;</blockquote>
                <button className="text-button" onClick={() => onOpen(rediscoverItem.memory)}>
                  Relive this moment <ArrowRight size={15} />
                </button>
              </div>
              <div className="rediscover-mark">
                <Compass size={35} />
                <span>
                  {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(rediscoverItem.memory.date))}
                  <br />
                  {rediscoverItem.memory.date.slice(0, 4)}
                </span>
              </div>
            </section>
          )}

          <section className="section">
            <SectionTitle label="Your recent memories" action="View all" onClick={() => onGo('memories')} />
            <div className="memory-grid">
              {recent.map((m) => (
                <MemoryCard key={m.id} memory={m} onClick={() => onOpen(m)} onAddPhoto={onAddPhoto} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
