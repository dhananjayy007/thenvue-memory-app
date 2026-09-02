import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native'
import {
  Edit3,
  Mic,
  Camera,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { MemoryRow } from '../components/MemoryRow'
import { MemoryCard } from '../components/MemoryCard'

const { width } = Dimensions.get('window')
const cardWidth = (width - 40) / 2

export function HomeScreen({
  memories = [],
  colors,
  displayName,
  refreshing,
  uploadingMemoryId,
  currentUserId,
  onRefresh,
  onSelectMemory,
  onOpenCapture,
  onOpenVoice,
  onNavigateTimeline,
  onAddPhoto,
}: {
  memories: Memory[]
  colors: ThemeColors
  displayName: string
  refreshing: boolean
  uploadingMemoryId?: string | null
  currentUserId?: string
  onRefresh: () => void
  onSelectMemory: (m: Memory) => void
  onOpenCapture: () => void
  onOpenVoice: () => void
  onNavigateTimeline: () => void
  onAddPhoto?: (m: Memory) => void
}) {

  const name = displayName ? displayName.split('@')[0] : 'there'
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)

  const now = new Date()
  const dateEyebrow = now
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase()

  const currentHour = now.getHours()
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'

  const currentYear = now.getFullYear()
  const todayISO = [
    currentYear,
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  const todayMemories = useMemo(() => memories.filter((m) => m.date === todayISO), [memories, todayISO])
  const recentMemories = useMemo(() => memories.slice(0, 6), [memories])

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Eyebrow & Greeting */}
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>{dateEyebrow}</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {greeting},{'\n'}
          {capitalizedName}.
        </Text>
        <Text style={[styles.subhead, { color: colors.textMuted }]}>
          Your life, remembered for you
        </Text>


        <TouchableOpacity
          style={[styles.reflectionButton, { borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Sparkles size={12} color={colors.accent} />
          <Text style={[styles.reflectionText, { color: colors.text }]}>
            {now.toLocaleString('default', { month: 'long' })} reflection
          </Text>
        </TouchableOpacity>
      </View>

      {/* Capture Prompt Card */}
      <TouchableOpacity
        style={[styles.capturePrompt, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.8}
        onPress={onOpenCapture}
      >
        <Edit3 size={18} color={colors.accent} />
        <Text style={[styles.promptText, { color: colors.textMuted }]}>
          Write something you want to remember...
        </Text>
        <ArrowRight size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={onOpenCapture}>
          <Edit3 size={14} color={colors.textMuted} />
          <Text style={[styles.quickActionText, { color: colors.textMuted }]}>Write</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionBtn} onPress={onOpenVoice}>
          <Mic size={14} color={colors.textMuted} />
          <Text style={[styles.quickActionText, { color: colors.textMuted }]}>Speak</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionBtn} onPress={onOpenCapture}>
          <Camera size={14} color={colors.textMuted} />
          <Text style={[styles.quickActionText, { color: colors.textMuted }]}>Add photo</Text>
        </TouchableOpacity>
      </View>

      {/* Today Section */}
      {todayMemories.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={onNavigateTimeline}
              activeOpacity={0.7}
            >
              <Text style={[styles.seeAllText, { color: colors.accent }]}>See timeline</Text>
              <ChevronRight size={12} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <View style={[styles.listContainer, { borderTopColor: colors.border }]}>
            {todayMemories.map((memory) => (
              <MemoryRow
                key={memory.id}
                memory={memory}
                colors={colors}
                onPress={() => onSelectMemory(memory)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Recent Memories 2-Column Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your recent memories</Text>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={onNavigateTimeline}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllText, { color: colors.accent }]}>View all</Text>
            <ChevronRight size={12} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {recentMemories.map((memory) => (
            <View key={memory.id} style={{ width: cardWidth }}>
              <MemoryCard
                memory={memory}
                colors={colors}
                onPress={() => onSelectMemory(memory)}
                onAddPhoto={onAddPhoto}
                isUploading={uploadingMemoryId === memory.id}
                currentUserId={currentUserId}
              />
            </View>
          ))}
        </View>

      </View>
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
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
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
  reflectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  reflectionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  capturePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 24,
  },
  promptText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  quickActionText: {
    fontSize: 11,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '500',
  },
  listContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})
