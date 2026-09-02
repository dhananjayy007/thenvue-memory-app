import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native'
import { ChevronRight, MapPin } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { formatTime } from '../lib/format'

export function MemoryRow({
  memory,
  colors,
  onPress,
}: {
  memory: Memory
  colors: ThemeColors
  onPress: () => void
}) {
  const photo = memory.media.find((m) => m.mediaType === 'image')

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { borderBottomColor: colors.border },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(memory.time)}</Text>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {memory.text || memory.title}
        </Text>

        <View style={styles.metaRow}>
          {memory.place ? (
            <View style={styles.placeItem}>
              <MapPin size={10} color={colors.textMuted} />
              <Text style={[styles.placeText, { color: colors.textMuted }]}>{memory.place}</Text>
            </View>
          ) : null}

          {memory.place && memory.topics.length > 0 ? (
            <Text style={[styles.bullet, { color: colors.border }]}>·</Text>
          ) : null}

          {memory.topics.length > 0 ? (
            <Text style={[styles.topicText, { color: colors.textMuted }]} numberOfLines={1}>
              {memory.topics[0]}
            </Text>
          ) : null}
        </View>
      </View>

      {photo ? (
        <Image source={{ uri: photo.url }} style={styles.thumbnail} />
      ) : null}

      <ChevronRight size={14} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  time: {
    width: 48,
    fontSize: 9,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  placeText: {
    fontSize: 9,
  },
  bullet: {
    fontSize: 9,
  },
  topicText: {
    fontSize: 9,
  },
  thumbnail: {
    width: 52,
    height: 43,
    borderRadius: 4,
  },
})

