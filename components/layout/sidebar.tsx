import { Bell, MoreHorizontal, Moon, Plus, Sun } from 'lucide-react'
import type { NavItem } from '@/types/memory'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

export function Sidebar({
  nav,
  view,
  onGo,
  onCapture,
  dark,
  onToggleTheme,
  displayName,
  onSignOut,
  onOpenNotifications,
  unreadCount = 0,
}: {
  nav: NavItem[]
  view: string
  onGo: (v: string) => void
  onCapture: () => void
  dark: boolean
  onToggleTheme: () => void
  displayName: string
  onSignOut: () => void
  onOpenNotifications?: () => void
  unreadCount?: number
}) {
  return (
    <aside className="sidebar">
      <button className="wordmark" onClick={() => onGo('home')}>
        <span className="wordmark-mark">
          <ThenvueLogo size={34} />
        </span>
        Thenvue
      </button>

      <p className="side-caption">Your life, remembered.</p>
      <nav className="side-nav">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={view === id ? 'nav-item active' : 'nav-item'}
            onClick={() => onGo(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}

        {onOpenNotifications && (
          <button
            type="button"
            className="nav-item sidebar-notifications-item"
            onClick={onOpenNotifications}
            style={{ position: 'relative' }}
          >
            <Bell size={17} />
            <span>Notifications</span>
            {unreadCount > 0 && <span className="sidebar-unread-pill">{unreadCount}</span>}
          </button>
        )}
      </nav>
      <div className="sidebar-bottom">
        <button className="capture-button" onClick={onCapture}>
          <Plus size={17} /> Capture
        </button>
        <button className="theme-button" onClick={onToggleTheme}>
          {dark ? <Sun size={17} /> : <Moon size={17} />} {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <form action={onSignOut} className="profile">
          <div className="avatar">{displayName[0]?.toUpperCase() ?? '?'}</div>
          <div>
            <strong>{displayName}</strong>
            <span>Private space</span>
          </div>
          <button type="submit" aria-label="Sign out">
            <MoreHorizontal size={16} />
          </button>
        </form>
      </div>
    </aside>
  )
}

