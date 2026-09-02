import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Bell, ArrowLeft, CheckCircle, Clock, Sparkles, User } from 'lucide-react-native'
import type { MemoryNotification } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/memories'

export function NotificationModal({
  visible,
  colors,
  onClose,
  onOpenPerspectiveComposer,
  onOpenMemory,
  onUnreadCountChange,
}: {
  visible: boolean
  colors: ThemeColors
  onClose: () => void
  onOpenPerspectiveComposer: (memoryId: string) => void
  onOpenMemory: (memoryId: string) => void
  onUnreadCountChange?: (count: number) => void
}) {
  const [notifications, setNotifications] = useState<MemoryNotification[]>([])
  const [loading, setLoading] = useState(false)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setNotifications(data)
      const unreadCount = data.filter((n) => n.status === 'unread').length
      if (onUnreadCountChange) onUnreadCountChange(unreadCount)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visible) {
      loadNotifications()
    }
  }, [visible])

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })))
    if (onUnreadCountChange) onUnreadCountChange(0)
  }

  const handleAction = async (notif: MemoryNotification) => {
    await markNotificationRead(notif.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, status: 'read' } : n))
    )

    const unread = notifications.filter((n) => n.id !== notif.id && n.status === 'unread').length
    if (onUnreadCountChange) onUnreadCountChange(unread)

    onClose()
    if (notif.type === 'invitation') {
      onOpenPerspectiveComposer(notif.memoryId)
    } else {
      onOpenMemory(notif.memoryId)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Updates & Invitations</Text>
          {notifications.some((n) => n.status === 'unread') ? (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={[styles.markAllText, { color: colors.accent }]}>Mark Read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* Notifications List */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={32} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No new notifications</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                When friends share memories with you or add perspectives, they will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.status === 'unread'
              return (
                <View
                  key={notif.id}
                  style={[
                    styles.notifCard,
                    { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                    isUnread && { borderColor: colors.accent, backgroundColor: colors.pill },
                  ]}
                >
                  <View style={styles.notifHeader}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                      <Text style={styles.avatarText}>{notif.actorName[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    <View style={styles.notifInfo}>
                      <Text style={[styles.notifTitle, { color: colors.text }]}>{notif.title}</Text>
                      <Text style={[styles.notifMemoryTitle, { color: colors.textMuted }]} numberOfLines={1}>
                        {notif.body}
                      </Text>
                    </View>
                    {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                      onPress={() => handleAction(notif)}
                    >
                      <Text style={styles.primaryBtnText}>
                        {notif.type === 'invitation' ? 'Add My Perspective' : 'View Memory'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { borderColor: colors.border }]}
                      onPress={async () => {
                        await markNotificationRead(notif.id)
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, status: 'read' } : n))
                        )
                      }}
                    >
                      <Text style={[styles.secondaryBtnText, { color: colors.textMuted }]}>Maybe Later</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  notifCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  notifInfo: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  notifMemoryTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 12,
  },
})
