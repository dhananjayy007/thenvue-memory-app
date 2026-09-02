import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native'
import {
  Users,
  MapPin,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  MoreHorizontal,
  UserCheck,
  X,
  Compass,
} from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { supabase } from '../lib/supabase'

export function YouScreen({
  memories = [],
  userEmail,
  currentDisplayName,
  colors,
  dark,
  onToggleTheme,
  onSignOut,
  onNavigatePeople,
  onNavigatePlaces,
  onNavigateAsk,
  onDisplayNameUpdated,
  onReplayTutorial,
}: {
  memories: Memory[]
  userEmail?: string
  currentDisplayName?: string
  colors: ThemeColors
  dark: boolean
  onToggleTheme: () => void
  onSignOut: () => void
  onNavigatePeople: () => void
  onNavigatePlaces: () => void
  onNavigateAsk: () => void
  onDisplayNameUpdated?: (newName: string) => void
  onReplayTutorial?: () => void
}) {
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [nameInput, setNameInput] = useState(currentDisplayName || userEmail?.split('@')[0] || '')
  const [savingName, setSavingName] = useState(false)

  const name = currentDisplayName || (userEmail ? userEmail.split('@')[0] : 'Dhananjay')
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)
  const initial = capitalizedName.charAt(0)

  const placesCount = useMemo(() => {
    const s = new Set(memories.map((m) => m.place).filter(Boolean))
    return s.size
  }, [memories])

  const peopleCount = useMemo(() => {
    const s = new Set(memories.flatMap((m) => m.people))
    return s.size
  }, [memories])

  const handleSaveUsername = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed || savingName) return

    setSavingName(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
      })
      if (error) throw error

      if (onDisplayNameUpdated) {
        onDisplayNameUpdated(trimmed)
      }
      setEditModalVisible(false)
    } catch (err) {
      console.error('Failed to update display name:', err)
    } finally {
      setSavingName(false)
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Eyebrow & Title */}
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR PRIVATE SPACE</Text>
        <Text style={[styles.title, { color: colors.text }]}>You</Text>
        <Text style={[styles.subhead, { color: colors.textMuted }]}>
          The shape of your life, at a glance.
        </Text>
      </View>

      {/* Profile Row */}
      <TouchableOpacity
        style={[styles.profileRow, { borderColor: colors.border }]}
        onPress={() => {
          setNameInput(name)
          setEditModalVisible(true)
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{capitalizedName}</Text>
          <Text style={[styles.profileMeta, { color: colors.textMuted }]}>
            Member since August 2026 · Tap to edit
          </Text>
        </View>

        <View style={styles.moreBtn}>
          <MoreHorizontal size={18} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Stats 3 Columns */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCol, { borderRightColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.text }]}>{memories.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {memories.length === 1 ? 'memory' : 'memories'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.statCol, { borderRightColor: colors.border }]}
          onPress={onNavigatePlaces}
          activeOpacity={0.7}
        >
          <Text style={[styles.statNum, { color: colors.text }]}>{placesCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {placesCount === 1 ? 'place' : 'places'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCol}
          onPress={onNavigatePeople}
          activeOpacity={0.7}
        >
          <Text style={[styles.statNum, { color: colors.text }]}>{peopleCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {peopleCount === 1 ? 'person' : 'people'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nav List */}
      <View style={[styles.menuList, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => {
            setNameInput(name)
            setEditModalVisible(true)
          }}
          activeOpacity={0.7}
        >
          <UserCheck size={18} color={colors.accent} />
          <Text style={[styles.menuText, { color: colors.text }]}>Change username</Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={onNavigatePeople}
          activeOpacity={0.7}
        >
          <Users size={18} color={colors.accent} />
          <Text style={[styles.menuText, { color: colors.text }]}>People</Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={onNavigatePlaces}
          activeOpacity={0.7}
        >
          <MapPin size={18} color={colors.accent} />
          <Text style={[styles.menuText, { color: colors.text }]}>Places</Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={onNavigateAsk}
          activeOpacity={0.7}
        >
          <Sparkles size={18} color={colors.accent} />
          <Text style={[styles.menuText, { color: colors.text }]}>Reflections</Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={onToggleTheme}
          activeOpacity={0.7}
        >
          {dark ? <Sun size={18} color={colors.accent} /> : <Moon size={18} color={colors.accent} />}
          <Text style={[styles.menuText, { color: colors.text }]}>
            {dark ? 'Use light mode' : 'Use dark mode'}
          </Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {onReplayTutorial ? (
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={onReplayTutorial}
            activeOpacity={0.7}
          >
            <Compass size={18} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>Replay tutorial</Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={onSignOut}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={[styles.menuText, { color: colors.danger }]}>Sign out</Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

      </View>

      {/* Edit Username Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Username</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>DISPLAY NAME</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.cardSecondary, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Your username"
              placeholderTextColor={colors.textMuted}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSaveUsername}
              disabled={savingName || !nameInput.trim()}
              activeOpacity={0.85}
            >
              {savingName ? (
                <ActivityIndicator color="#211d1a" />
              ) : (
                <Text style={styles.modalSaveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 110,
  },
  heading: {
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -1,
  },
  subhead: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#211d1a',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  profileMeta: {
    fontSize: 10,
    marginTop: 3,
  },
  moreBtn: {
    padding: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 24,
  },
  statCol: {
    flex: 1,
    paddingHorizontal: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  statNum: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  menuList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 18,
  },
  modalSaveBtn: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#211d1a',
    fontSize: 14,
    fontWeight: '600',
  },
})
