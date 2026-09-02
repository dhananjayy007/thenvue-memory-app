'use client'

import { ChevronRight, Compass, MapPin, MoreHorizontal,  Sun, Users } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'
import type { Memory } from '@/types/memory'
import { PageIntro } from '@/components/shared/page-intro'

export function You({
  memories,
  onGo,
  onTheme,
  dark,
  displayName,
  memberSince,
  onSignOut,
  onReplayTutorial,
}: {
  memories: Memory[]
  onGo: (v: string) => void
  onTheme: () => void
  dark: boolean
  displayName: string
  memberSince: string
  onSignOut: () => void
  onReplayTutorial?: () => void
}) {
  const placeCount = new Set(memories.map((memory) => memory.place).filter(Boolean)).size
  const peopleCount = new Set(memories.flatMap((memory) => memory.people)).size

  return (
    <div className="page you-page">
      <PageIntro
        eyebrow="Your private space"
        title="You"
        description="The shape of your life, at a glance."
      />
      <form action={onSignOut} className="you-profile">
        <div className="you-avatar">{displayName[0]?.toUpperCase() ?? '?'}</div>
        <div>
          <strong>{displayName}</strong>
          <span>Member since {memberSince}</span>
        </div>
        <button type="submit" aria-label="Sign out">
          <MoreHorizontal size={18} />
        </button>
      </form>
      <div className="you-stats">
        <div>
          <strong>{memories.length}</strong>
          <span>memories</span>
        </div>
        <div>
          <strong>{placeCount}</strong>
          <span>{placeCount === 1 ? 'place' : 'places'}</span>
        </div>
        <div>
          <strong>{peopleCount}</strong>
          <span>{peopleCount === 1 ? 'person' : 'people'}</span>
        </div>
      </div>
      <div className="you-links">
        <button onClick={() => onGo('people')}>
          <Users size={18} />
          <span>People</span>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => onGo('places')}>
          <MapPin size={18} />
          <span>Places</span>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => onGo('ask')}>
          <CustomBrainIcon size={18} />
          <span>Reflections</span>
          <ChevronRight size={16} />
        </button>
        <button onClick={onTheme}>
          <Sun size={18} />
          <span>{dark ? 'Use light mode' : 'Use dark mode'}</span>
          <ChevronRight size={16} />
        </button>
        {onReplayTutorial && (
          <button onClick={onReplayTutorial}>
            <Compass size={18} />
            <span>Replay tutorial</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
