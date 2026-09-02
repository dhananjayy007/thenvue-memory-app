import { Bell, Moon, Plus, Search, Sun } from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

export function Topbar({
  dark,
  onToggleTheme,
  onCapture,
  onSearch,
  onOpenNotifications,
  unreadCount = 0,
}: {
  dark: boolean
  onToggleTheme: () => void
  onCapture: () => void
  onSearch: () => void
  onOpenNotifications?: () => void
  unreadCount?: number
}) {
  return (
    <header className="topbar">
      <div className="mobile-brand">
        <span className="wordmark-mark">
          <ThenvueLogo size={32} />
        </span>
        Thenvue
      </div>

      <div className="top-actions">
        <button aria-label="Search" onClick={onSearch}>
          <Search size={18} />
        </button>
        {onOpenNotifications && (
          <button
            className="topbar-notifications-btn"
            aria-label="Notifications"
            onClick={onOpenNotifications}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="topbar-unread-badge">{unreadCount}</span>}
          </button>
        )}
        <button aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="mobile-capture" onClick={onCapture}>
          <Plus size={18} />
        </button>
      </div>
    </header>
  )
}

