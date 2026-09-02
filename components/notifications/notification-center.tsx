'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, Sparkles, UserPlus, X } from 'lucide-react'
import type { MemoryNotification } from '@/types/memory'
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  respondToInvitationAction,
} from '@/app/memories/actions'

export function NotificationCenter({
  isOpen,
  onClose,
  onOpenPerspectiveComposer,
  onOpenMemory,
  onUnreadCountChange,
}: {
  isOpen: boolean
  onClose: () => void
  onOpenPerspectiveComposer: (memoryId: string) => void
  onOpenMemory: (memoryId: string) => void
  onUnreadCountChange?: (count: number) => void
}) {
  const [notifications, setNotifications] = useState<MemoryNotification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const list = await getNotificationsAction()
      setNotifications(list)
      const unreadCount = list.filter((n) => n.status === 'unread').length
      onUnreadCountChange?.(unreadCount)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })))
    onUnreadCountChange?.(0)
    await markAllNotificationsReadAction().catch(console.error)
  }

  const handleAcceptAndOpen = async (notification: MemoryNotification) => {
    // 1. Accept invitation
    respondToInvitationAction(notification.memoryId, 'accepted').catch(console.error)
    // 2. Mark notification read
    markNotificationReadAction(notification.id).catch(console.error)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, status: 'read' } : n))
    )
    onUnreadCountChange?.(notifications.filter((n) => n.id !== notification.id && n.status === 'unread').length)
    // 3. Close panel and open composer
    onClose()
    onOpenPerspectiveComposer(notification.memoryId)
  }

  const handleDismiss = async (notificationId: string, memoryId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    markNotificationReadAction(notificationId).catch(console.error)
    onUnreadCountChange?.(notifications.filter((n) => n.id !== notificationId && n.status === 'unread').length)
  }

  const handleViewMemory = async (notification: MemoryNotification) => {
    markNotificationReadAction(notification.id).catch(console.error)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, status: 'read' } : n))
    )
    onClose()
    onOpenMemory(notification.memoryId)
  }

  return (
    <div className="overlay notification-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="notification-panel">
        <header className="notification-panel-header">
          <div className="notification-header-title">
            <Bell size={18} />
            <span>Notifications</span>
          </div>
          <div className="notification-header-actions">
            {notifications.some((n) => n.status === 'unread') && (
              <button className="notification-mark-all-btn" onClick={handleMarkAllRead}>
                <Check size={14} /> Mark all read
              </button>
            )}
            <button className="capture-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="notification-list">
          {loading && notifications.length === 0 ? (
            <div className="notification-empty">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <p>No notifications yet.</p>
              <small>When friends invite you to shared memories, they will appear here.</small>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = n.status === 'unread'
              const isInvitation = n.type === 'invitation'

              return (
                <div key={n.id} className={`notification-item ${isUnread ? 'unread' : ''}`}>
                  <div className="notification-item-avatar">
                    {isInvitation ? <UserPlus size={16} /> : <Sparkles size={16} />}
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-item-header">
                      <strong>{n.title}</strong>
                      {isUnread && <span className="unread-dot" />}
                    </div>
                    <p className="notification-item-memory-title">{n.body}</p>

                    {isInvitation ? (
                      <div className="notification-actions">
                        <button
                          type="button"
                          className="notification-primary-btn"
                          onClick={() => handleAcceptAndOpen(n)}
                        >
                          Add My Perspective
                        </button>
                        <button
                          type="button"
                          className="notification-secondary-btn"
                          onClick={() => handleDismiss(n.id, n.memoryId)}
                        >
                          Maybe Later
                        </button>
                      </div>
                    ) : (
                      <div className="notification-actions">
                        <button
                          type="button"
                          className="notification-primary-btn"
                          onClick={() => handleViewMemory(n)}
                        >
                          View Shared Memory
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
