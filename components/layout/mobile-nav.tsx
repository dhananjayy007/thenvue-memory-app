import { Home, Clock, Plus, User } from 'lucide-react'
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
        aria-label="Home"
        title="Home"
      >
        <Home size={20} strokeWidth={1.8} />
      </button>
      <button
        className={view === 'timeline' ? 'mobile-nav-item active' : 'mobile-nav-item'}
        onClick={() => onGo('timeline')}
        aria-label="Timeline"
        title="Timeline"
      >
        <Clock size={20} strokeWidth={1.8} />
      </button>
      <button
        className="mobile-nav-item mobile-nav-capture-btn"
        onClick={onCapture}
        aria-label="Capture"
        title="Capture memory"
      >
        <div className="mobile-capture-squircle">
          <Plus size={18} strokeWidth={2.2} />
        </div>
      </button>
      <button
        className={view === 'ask' ? 'mobile-nav-item active' : 'mobile-nav-item'}
        onClick={() => onGo('ask')}
        aria-label="Ask"
        title="Ask"
      >
        <CustomBrainIcon size={20} />
      </button>
      <button
        className={view === 'you' ? 'mobile-nav-item active' : 'mobile-nav-item'}
        onClick={() => onGo('you')}
        aria-label="You"
        title="You"
      >
        <User size={20} strokeWidth={1.8} />
      </button>
    </nav>
  )
}
