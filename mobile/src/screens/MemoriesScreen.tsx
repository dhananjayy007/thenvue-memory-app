import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
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
import { searchSemanticMemoriesApi } from '../lib/ai'

const { width } = Dimensions.get('window')
const cardWidth = (width - 40) / 2

export function MemoriesScreen({
  memories,
  colors,
  onBack,
  onSelectMemory,
  onEndReached,
  isLoadingMore = false,
  initialQuery = '',
}: {
  memories: Memory[]
  colors: ThemeColors
  dark?: boolean
  onToggleTheme?: () => void
  onBack?: () => void
  onSelectMemory: (m: Memory) => void
  onEndReached?: () => void
  isLoadingMore?: boolean
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const [semanticResults, setSemanticResults] = useState<Memory[] | null>(null)
  const [isSearchingSemantic, setIsSearchingSemantic] = useState(false)

  // Sync with initialQuery prop if passed
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  // Debounced semantic search using the existing backend search endpoint
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSemanticResults(null)
      setIsSearchingSemantic(false)
      return
    }

    let active = true
    setIsSearchingSemantic(true)

    const timeout = setTimeout(async () => {
      try {
        const results = await searchSemanticMemoriesApi(trimmed, 20)
        if (active) {
          setSemanticResults(results.length > 0 ? results : null)
        }
      } catch {
        if (active) setSemanticResults(null)
      } finally {
        if (active) setIsSearchingSemantic(false)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [query])

  // Extract top unique tags/topics/people for instant filtering
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const m of memories) {
      for (const p of m.people) if (p) set.add(p)
      for (const t of m.topics) if (t) set.add(`#${t}`)
      if (m.place) set.add(m.place)
    }
    return Array.from(set).slice(0, 15)
  }, [memories])

  const filteredMemories = useMemo(() => {
    if (!query.trim()) return memories

    const q = query.toLowerCase().replace(/^#/, '')
    const keywordMatches = memories.filter(
      (m) =>
        `${m.title} ${m.text} ${m.place} ${m.people.join(' ')} ${m.topics.join(' ')}`
          .toLowerCase()
          .includes(q)
    )

    if (semanticResults && semanticResults.length > 0) {
      const semanticIds = new Set(semanticResults.map((m) => m.id))
      const extraKeywords = keywordMatches.filter((m) => !semanticIds.has(m.id))
      return [...semanticResults, ...extraKeywords]
    }

    return keywordMatches.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateDiff !== 0) return dateDiff
      return (b.time || '').localeCompare(a.time || '')
    })
  }, [memories, query, semanticResults])

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
          autoCapitalize="none"
        />
        {isSearchingSemantic ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Horizontal Tag Pills with Highlight */}
      {allTags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScrollRow}>
          <TouchableOpacity
            style={[
              styles.filterTagPill,
              {
                backgroundColor: !query ? colors.accent : colors.card,
                borderColor: !query ? colors.accent : colors.border,
              },
            ]}
            onPress={() => setQuery('')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTagText,
                { color: !query ? '#211d1a' : colors.textMuted, fontWeight: !query ? '700' : '400' },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {allTags.map((tag) => {
            const isSelected = query.toLowerCase().replace(/^#/, '') === tag.toLowerCase().replace(/^#/, '')
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.filterTagPill,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.card,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setQuery(isSelected ? '' : tag.replace(/^#/, ''))}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTagText,
                    { color: isSelected ? '#211d1a' : colors.text, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
    </View>
  ), [colors, query, allTags])

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
  tagsScrollRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
  },
  filterTagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  filterTagText: {
    fontSize: 12,
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

