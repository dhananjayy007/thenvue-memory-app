import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { MapPin, ChevronRight } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'

export function PlacesScreen({
  memories,
  colors,
  onSelectPlace,
}: {
  memories: Memory[]
  colors: ThemeColors
  onSelectPlace: (place: string) => void
}) {
  const placesSummary = useMemo(() => {
    const map = new Map<string, Memory[]>()
    for (const m of memories) {
      if (m.place) {
        if (!map.has(m.place)) map.set(m.place, [])
        map.get(m.place)!.push(m)
      }
    }
    return [...map.entries()]
      .map(([place, list]) => ({
        place,
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
        <Text style={[styles.eyebrow, { color: colors.accent }]}>GEOGRAPHY</Text>
        <Text style={[styles.title, { color: colors.text }]}>Places</Text>
        <Text style={[styles.subhead, { color: colors.textMuted }]}>
          The places where your life happened.
        </Text>
      </View>

      <View style={[styles.list, { borderTopColor: colors.border }]}>
        {placesSummary.length === 0 ? (
          <View style={styles.empty}>
            <MapPin size={24} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No places recorded yet</Text>
          </View>
        ) : (
          placesSummary.map((item) => (
            <TouchableOpacity
              key={item.place}
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => onSelectPlace(item.place)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { borderColor: colors.accent }]} />
              <View style={styles.info}>
                <Text style={[styles.placeName, { color: colors.text }]}>{item.place}</Text>
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  info: {
    flex: 1,
  },
  placeName: {
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
