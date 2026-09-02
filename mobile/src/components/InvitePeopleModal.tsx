import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { UserPlus, Search, X, Check, ArrowLeft, Users } from 'lucide-react-native'
import type { Memory, UserSearchResult, MemoryParticipant } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { searchUsers, inviteParticipants } from '../lib/memories'

export function InvitePeopleModal({
  memory,
  visible,
  colors,
  onClose,
  onInvited,
}: {
  memory: Memory | null
  visible: boolean
  colors: ThemeColors
  onClose: () => void
  onInvited: () => void
}) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (visible) {
      setQuery('')
      setSearchResults([])
      setSelectedUsers([])
    }
  }, [visible])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([])
      return
    }

    let active = true
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchUsers(trimmed)
        if (active) setSearchResults(res)
      } catch {
        if (active) setSearchResults([])
      } finally {
        if (active) setSearching(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  if (!memory) return null

  const existingParticipants = memory.participants || []
  const existingUserIds = new Set(existingParticipants.map((p) => p.userId))

  const toggleUser = (user: UserSearchResult) => {
    if (existingUserIds.has(user.id)) return
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id))
    } else {
      setSelectedUsers((prev) => [...prev, user])
    }
  }

  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0) return
    setSending(true)
    try {
      await inviteParticipants(
        memory.id,
        selectedUsers.map((u) => u.id)
      )
      onInvited()
      onClose()
    } catch (err: any) {
      Alert.alert('Invitation Failed', err.message || 'Could not send invitations.')
    } finally {
      setSending(false)
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
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Add People</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Invite friends to add their perspective
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name or email..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Selected Chips */}
          {selectedUsers.length > 0 ? (
            <View style={styles.chipsContainer}>
              {selectedUsers.map((user) => (
                <View key={user.id} style={[styles.chip, { backgroundColor: colors.pill, borderColor: colors.accent }]}>
                  <View style={[styles.chipAvatar, { backgroundColor: colors.accent }]}>
                    <Text style={styles.chipAvatarText}>{user.displayName[0]?.toUpperCase() || 'U'}</Text>
                  </View>
                  <Text style={[styles.chipName, { color: colors.text }]}>{user.displayName}</Text>
                  <TouchableOpacity onPress={() => toggleUser(user)}>
                    <X size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          {/* Existing Participants */}
          {existingParticipants.length > 0 ? (
            <View style={styles.existingSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>People in this memory</Text>
              <View style={styles.existingChips}>
                {existingParticipants.map((p) => (
                  <View key={p.id} style={[styles.existingChip, { backgroundColor: colors.cardSecondary }]}>
                    <Text style={[styles.existingName, { color: colors.text }]}>{p.displayName}</Text>
                    <Text style={[styles.existingStatus, { color: p.status === 'accepted' ? '#10b981' : '#f59e0b' }]}>
                      {p.status}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Search Results List */}
          <ScrollView style={styles.resultsList}>
            {searching ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={colors.accent} />
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id)
                const isExisting = existingUserIds.has(user.id)

                return (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userRow,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.cardSecondary },
                      isExisting && { opacity: 0.5 },
                    ]}
                    onPress={() => toggleUser(user)}
                    disabled={isExisting}
                  >
                    <View style={[styles.avatar, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                      <Text style={[styles.avatarText, { color: colors.text }]}>
                        {user.displayName[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>{user.displayName}</Text>
                      {user.email ? <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user.email}</Text> : null}
                    </View>
                    {isExisting ? (
                      <Text style={[styles.statusTag, { color: colors.textMuted }]}>Already added</Text>
                    ) : isSelected ? (
                      <Check size={18} color={colors.accent} />
                    ) : (
                      <UserPlus size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                )
              })
            ) : query.length >= 2 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No users found for "{query}"</Text>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Type a name to search Thenvue users</Text>
            )}
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.accent },
              (selectedUsers.length === 0 || sending) && { opacity: 0.5 },
            ]}
            onPress={handleSendInvitations}
            disabled={selectedUsers.length === 0 || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>
                {selectedUsers.length > 0 ? `Send Invitations (${selectedUsers.length})` : 'Select People to Invite'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  chipAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  chipName: {
    fontSize: 12,
    fontWeight: '500',
  },
  existingSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  existingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  existingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  existingName: {
    fontSize: 12,
    fontWeight: '500',
  },
  existingStatus: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  resultsList: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  statusTag: {
    fontSize: 11,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 36,
    fontSize: 13,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sendBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})
