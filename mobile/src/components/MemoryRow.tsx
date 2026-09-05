import React, { memo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Image } from 'expo-image'
import { ChevronRight, MapPin } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { formatTime, formatDateShort } from '../lib/format'

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
      <View style={styles.timeCol}>
        <Text style={[styles.date, { color: colors.text }]}>{formatDateShort(memory.date)}</Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(memory.time)}</Text>
      </View>

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
        <Image
          source={{ uri: photo.url, cacheKey: photo.url }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={0}
          recyclingKey={photo.url}
          priority="high"
          cachePolicy="memory-disk"
        />
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
  timeCol: {
    width: 58,
    gap: 2,
  },
  date: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
  },
  time: {
    fontSize: 9,
    fontWeight: '400',
    lineHeight: 12,
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

