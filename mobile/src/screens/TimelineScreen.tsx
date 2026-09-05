import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { Search } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { MemoryRow } from '../components/MemoryRow'

export function TimelineScreen({
  memories = [],
  colors,
  onSelectMemory,
}: {
  memories: Memory[]
  colors: ThemeColors
  onSelectMemory: (m: Memory) => void
}) {
  const [filter, setFilter] = useState<'all' | 'photos' | 'places' | 'people'>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const list = memories.filter((m) => {
      if (filter === 'photos' && !m.media.some((x) => x.mediaType === 'image')) return false
      if (filter === 'places' && !m.place) return false
      if (filter === 'people' && m.people.length === 0) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        m.title.toLowerCase().includes(q) ||
        m.text.toLowerCase().includes(q) ||
        (m.place && m.place.toLowerCase().includes(q)) ||
        m.people.some((p) => p.toLowerCase().includes(q)) ||
        m.topics.some((t) => t.toLowerCase().includes(q))
      )
    })

    return list.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateDiff !== 0) return dateDiff
      return (b.time || '').localeCompare(a.time || '')
    })
  }, [memories, filter, search])

  // Group by Month & Year
  const grouped = useMemo(() => {
    const map = new Map<string, Memory[]>()
    for (const mem of filtered) {
      const d = new Date(`${mem.date}T12:00:00Z`)
      const key = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(mem)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Eyebrow & Title */}
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR LIFE, IN ORDER</Text>
        <Text style={[styles.title, { color: colors.text }]}>Your timeline</Text>
        <Text style={[styles.subhead, { color: colors.textMuted }]}>
          Browse the moments that make up your life.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { borderBottomColor: colors.border }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search memories..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Pills */}
      <View style={styles.pillsRow}>
        {(['all', 'photos', 'places', 'people'] as const).map((f) => {
          const active = filter === f
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.pill,
                { backgroundColor: active ? colors.cardSecondary : 'transparent' },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: active ? colors.text : colors.textMuted },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Timeline Groups */}
      {grouped.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No memories found</Text>
        </View>
      ) : (
        grouped.map(([monthYear, monthMems]) => (
          <View key={monthYear} style={styles.monthSection}>
            <Text style={[styles.monthTitle, { color: colors.text, borderBottomColor: colors.border }]}>
              {monthYear}
            </Text>
            <View style={styles.monthList}>
              {monthMems.map((m) => (
                <MemoryRow key={m.id} memory={m} colors={colors} onPress={() => onSelectMemory(m)} />
              ))}
            </View>
          </View>
        ))
      )}
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
    paddingBottom: 130,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 28,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthList: {},
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
})
