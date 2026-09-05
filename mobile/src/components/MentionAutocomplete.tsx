import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import type { ThemeColors } from '../theme/colors'
import type { UserSearchResult } from '../types/memory'
import { searchUsers } from '../lib/memories'

export function MentionAutocomplete({
  text,
  colors,
  onSelectUser,
}: {
  text: string
  colors: ThemeColors
  onSelectUser: (user: UserSearchResult) => void
}) {
  const [query, setQuery] = useState<string | null>(null)
  const [users, setUsers] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  // Detect active @mention at the end of text or before cursor
  useEffect(() => {
    const match = text.match(/@([a-zA-Z0-9_-]*)$/)
    if (match) {
      setQuery(match[1])
    } else {
      setQuery(null)
      setUsers([])
    }
  }, [text])

  // Search users whenever active @query changes
  useEffect(() => {
    if (query === null) return

    let active = true
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(query)
        if (active) {
          setUsers(results)
        }
      } catch (err) {
        console.warn('Mention search error:', err)
      } finally {
        if (active) setLoading(false)
      }
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  if (query === null || (users.length === 0 && !loading)) {
    return null
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.textMuted }]}>
          {loading ? 'Searching friends...' : 'Tag a friend'}
        </Text>
        {loading && <ActivityIndicator size="small" color={colors.accent} />}
      </View>

      <ScrollView
        style={styles.scrollList}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        {users.map((u) => {
          const initial = u.displayName?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U'
          return (
            <TouchableOpacity
              key={u.id}
              style={[styles.userRow, { borderBottomColor: colors.border }]}
              onPress={() => onSelectUser(u)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.displayName, { color: colors.text }]}>{u.displayName}</Text>
                {u.email ? (
                  <Text style={[styles.handleText, { color: colors.textMuted }]}>
                    @{u.email.split('@')[0]}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: 180,
    marginTop: 6,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollList: {
    maxHeight: 140,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 13,
    fontWeight: '600',
  },
  handleText: {
    fontSize: 11,
    marginTop: 1,
  },
})
