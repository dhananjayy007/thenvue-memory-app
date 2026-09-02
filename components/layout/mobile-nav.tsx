import { BookOpen, CircleUserRound, Clock3, Plus } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

export function MobileNav({
  view,
  onGo,
  onCapture,
}: {
  view: string
  onGo: (v: string) => void
  onCapture: () => void
}) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <button
        className={view === 'home' ? 'mobile-nav-item active' : 'mobile-nav-item'}
        onClick={() => onGo('home')}
      >
        <BookOpen size={18} />
        <span>Home</span>
      </button>
      <button
        className={view === 'timeline' ? 'mobile-nav-item active' : 'mobile-nav-item'}
        onClick={() => onGo('timeline')}
      >
        <Clock3 size={18} />
        <span>Timeline</span>
      </button>
      <button className="mobile-nav-capture" onClick={onCapture}>
        <Plus size={22} />
        <span>Capture</span>
      </button>
      <button
        className={view === 'ask' ? 'mobile-nav-item active' : 'mobile-nav-item'}
        onClick={() => onGo('ask')}
      >
        <CustomBrainIcon size={18} />
        <span>Ask</span>
      </button>
      <button
        className={view === 'you' ? 'mobile-nav-item active' : 'mobile-nav-item'}
        onClick={() => onGo('you')}
      >
        <CircleUserRound size={18} />
        <span>You</span>
      </button>
    </nav>
  )
}
