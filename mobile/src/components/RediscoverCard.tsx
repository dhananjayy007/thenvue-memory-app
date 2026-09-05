import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Film, ArrowRight } from 'lucide-react-native'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { formatDate } from '../lib/format'

export function RediscoverCard({
  memory,
  headline,
  colors,
  onPress,
}: {
  memory: Memory
  headline: string
  colors: ThemeColors
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
          <Film size={14} color={colors.accent} />
          <Text style={[styles.badgeText, { color: colors.accent }]}>Rediscover</Text>
        </View>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(memory.date)}</Text>
      </View>

      <Text style={[styles.headline, { color: colors.text }]}>{headline}</Text>

      <Text style={[styles.quote, { color: colors.textSecondary }]} numberOfLines={3}>
        &ldquo;{memory.text}&rdquo;
      </Text>

      <View style={styles.footer}>
        <Text style={[styles.actionText, { color: colors.accent }]}>Relive this moment</Text>
        <ArrowRight size={14} color={colors.accent} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headline: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  quote: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
})
