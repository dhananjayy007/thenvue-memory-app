'use client'

import { Bell, HelpCircle, Search, Sun, Moon } from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

export function Topbar({
  dark,
  onToggleTheme,
  onSearch,
  onOpenNotifications,
  onOpenTutorial,
  unreadCount = 0,
}: {
  dark?: boolean
  onToggleTheme?: () => void
  onCapture?: () => void
  onSearch: () => void
  onOpenNotifications?: () => void
  onOpenTutorial?: () => void
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
        {onToggleTheme && (
          <button
            type="button"
            className="topbar-theme-toggle"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onToggleTheme}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        {onOpenTutorial && (
          <button type="button" aria-label="Tutorial" title="Tutorial & Walkthrough" onClick={onOpenTutorial}>
            <HelpCircle size={18} />
          </button>
        )}
        {onOpenNotifications && (
          <button
            type="button"
            className="topbar-notifications-btn"
            aria-label="Notifications"
            onClick={onOpenNotifications}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="topbar-unread-badge">{unreadCount}</span>}
          </button>
        )}
        <button type="button" aria-label="Search" title="Search memories" onClick={onSearch}>
          <Search size={18} />
        </button>
      </div>
    </header>
  )
}
