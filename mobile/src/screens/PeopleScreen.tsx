import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { Users, ChevronRight } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'

export function PeopleScreen({
  memories,
  colors,
  onSelectPerson,
}: {
  memories: Memory[]
  colors: ThemeColors
  onSelectPerson: (person: string) => void
}) {
  const peopleSummary = useMemo(() => {
    const map = new Map<string, Memory[]>()
    for (const m of memories) {
      for (const p of m.people) {
        if (!map.has(p)) map.set(p, [])
        map.get(p)!.push(m)
      }
    }
    return [...map.entries()]
      .map(([name, list]) => ({
        name,
        count: list.length,
        latestMemory: list[0],
      }))
      .sort((a, b) => b.count - a.count)
  }, [memories])

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>RELATIONSHIPS</Text>
        <Text style={[styles.title, { color: colors.text }]}>People</Text>
        <Text style={[styles.subhead, { color: colors.textMuted }]}>
          The people who make up your story.
        </Text>
      </View>

      <View style={[styles.list, { borderTopColor: colors.border }]}>
        {peopleSummary.length === 0 ? (
          <View style={styles.empty}>
            <Users size={24} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No people tagged yet</Text>
          </View>
        ) : (
          peopleSummary.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => onSelectPerson(item.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.count, { color: colors.textMuted }]}>
                  {item.count} {item.count === 1 ? 'memory' : 'memories'}
                </Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
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
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#211d1a',
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  count: {
    fontSize: 10,
    marginTop: 2,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
  },
})
