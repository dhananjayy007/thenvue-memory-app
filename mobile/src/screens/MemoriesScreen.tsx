import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { Search, ArrowLeft } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { MemoryCard } from '../components/MemoryCard'

const { width } = Dimensions.get('window')
const cardWidth = (width - 40) / 2

export function MemoriesScreen({
  memories,
  colors,
  onBack,
  onSelectMemory,
}: {
  memories: Memory[]
  colors: ThemeColors
  dark?: boolean
  onToggleTheme?: () => void
  onBack?: () => void
  onSelectMemory: (m: Memory) => void
}) {
  const [query, setQuery] = useState('')

  const filteredMemories = useMemo(() => {
    let list = memories
    if (query.trim()) {
      const q = query.toLowerCase()
      list = memories.filter(
        (m) =>
          `${m.title} ${m.text} ${m.place} ${m.people.join(' ')} ${m.topics.join(' ')}`
            .toLowerCase()
            .includes(q)
      )
    }

    return list.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateDiff !== 0) return dateDiff
      return (b.time || '').localeCompare(a.time || '')
    })
  }, [memories, query])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Back button */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>All Memories</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
            {memories.length} moment{memories.length === 1 ? '' : 's'} kept
          </Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search words, people, places, topics..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredMemories.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No memories found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {query ? `We couldn't find any memories matching "${query}".` : 'Capture your first memory to begin.'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredMemories.map((m) => (
              <View key={m.id} style={{ width: cardWidth }}>
                <MemoryCard memory={m} colors={colors} onPress={() => onSelectMemory(m)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyCard: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
})
