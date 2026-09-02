import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Edit3, Camera } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { formatDate, isSameCalendarDay } from '../lib/format'

export function MemoryCard({
  memory,
  colors,
  onPress,
  onAddPhoto,
  isUploading = false,
  currentUserId,
}: {
  memory: Memory
  colors: ThemeColors
  onPress: () => void
  onAddPhoto?: (memory: Memory) => void
  isUploading?: boolean
  currentUserId?: string
}) {
  const photo = memory.media.find((m) => m.mediaType === 'image')
  const isOwner = !memory.userId || !currentUserId || memory.userId === currentUserId
  const canAddPhoto = Boolean(onAddPhoto) && isOwner && isSameCalendarDay(memory.date)

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* Fixed-Height Visual Container */}
      <View style={styles.visualContainer}>
        {photo ? (
          <Image source={{ uri: photo.url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.pill }]}>
            <Edit3 size={20} color={colors.accent} />
          </View>
        )}
      </View>

      {/* Uniform Content Container */}
      <View style={styles.copy}>
        {/* Date and Optional Same-Day Camera Icon */}
        <View style={styles.dateRow}>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(memory.date)}</Text>
          {canAddPhoto ? (
            <TouchableOpacity
              style={styles.addPhotoButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              disabled={isUploading}
              onPress={(e) => {
                // Prevent card selection modal from triggering
                e?.stopPropagation?.()
                onAddPhoto?.(memory)
              }}
              accessibilityLabel="Add photo to memory"
              accessibilityRole="button"
            >
              {isUploading ? (
                <ActivityIndicator size={11} color={colors.accent} />
              ) : (
                <Camera size={13} color={colors.accent} strokeWidth={2} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {memory.text || memory.title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          {memory.place ? (
            <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
              {memory.place}
            </Text>
          ) : null}

          {memory.place && memory.topics.length > 0 ? (
            <Text style={[styles.bullet, { color: colors.textMuted }]}>·</Text>
          ) : null}

          {memory.topics.length > 0 ? (
            <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
              {memory.topics[0]}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 8,
    height: 205, // Fixed uniform height for all cards
  },
  visualContainer: {
    width: '100%',
    height: 105,
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    padding: 10,
    height: 98,
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 16,
  },
  date: {
    fontSize: 9,
  },
  addPhotoButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    height: 36,
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 16,
  },
  metaText: {
    fontSize: 9,
  },
  bullet: {
    fontSize: 9,
  },
})
