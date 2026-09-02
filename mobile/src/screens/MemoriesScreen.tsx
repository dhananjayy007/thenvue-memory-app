import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native'
import { Search } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { Header } from '../components/Header'
import { MemoryCard } from '../components/MemoryCard'

export function MemoriesScreen({
  memories,
  colors,
  dark,
  onToggleTheme,
  onSelectMemory,
}: {
  memories: Memory[]
  colors: ThemeColors
  dark: boolean
  onToggleTheme: () => void
  onSelectMemory: (m: Memory) => void
}) {
  const [query, setQuery] = useState('')

  const filteredMemories = useMemo(() => {
    if (!query.trim()) return memories
    const q = query.toLowerCase()
    return memories.filter(
      (m) =>
        `${m.title} ${m.text} ${m.place} ${m.people.join(' ')} ${m.topics.join(' ')}`
          .toLowerCase()
          .includes(q)
    )
  }, [memories, query])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Memories"
        subtitle={`${memories.length} moments kept`}
        colors={colors}
        dark={dark}
        onToggleTheme={onToggleTheme}
      />

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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {filteredMemories.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No memories found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {query ? `We couldn't find any memories matching "${query}".` : 'Capture your first memory to begin.'}
            </Text>
          </View>
        ) : (
          filteredMemories.map((m) => (
            <MemoryCard key={m.id} memory={m} colors={colors} onPress={() => onSelectMemory(m)} />
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
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
