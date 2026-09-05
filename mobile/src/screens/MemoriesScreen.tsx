import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
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
  onEndReached,
  isLoadingMore = false,
}: {
  memories: Memory[]
  colors: ThemeColors
  dark?: boolean
  onToggleTheme?: () => void
  onBack?: () => void
  onSelectMemory: (m: Memory) => void
  onEndReached?: () => void
  isLoadingMore?: boolean
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

  const renderHeader = useCallback(() => (
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
  ), [colors, query])

  const renderItem = useCallback(({ item }: { item: Memory }) => (
    <View style={{ width: cardWidth, margin: 4 }}>
      <MemoryCard memory={item} colors={colors} onPress={() => onSelectMemory(item)} />
    </View>
  ), [colors, onSelectMemory])

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    )
  }, [isLoadingMore, colors])

  const renderEmpty = useCallback(() => (
    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No memories found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {query ? `We couldn't find any memories matching "${query}".` : 'Capture your first memory to begin.'}
      </Text>
    </View>
  ), [colors, query])

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

      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        data={filteredMemories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        showsVerticalScrollIndicator={false}
      />
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
