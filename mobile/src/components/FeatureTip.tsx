import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Sparkles, X, ChevronRight } from 'lucide-react-native'
import type { ThemeColors } from '../theme/colors'

export function FeatureTip({
  tipId,
  title,
  description,
  actionLabel,
  onAction,
  colors,
}: {
  tipId: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  colors: ThemeColors
}) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(`tip_dismissed_${tipId}`).then((val) => {
      if (val !== 'true') {
        setDismissed(false)
      }
    })
  }, [tipId])

  const handleDismiss = async () => {
    setDismissed(true)
    await AsyncStorage.setItem(`tip_dismissed_${tipId}`, 'true')
  }

  if (dismissed) return null

  return (
    <View style={[styles.container, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Sparkles size={12} color={colors.accent} />
          <Text style={[styles.badgeText, { color: colors.accent }]}>PRO TIP</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>

      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.actionBtnText, { color: colors.accent }]}>{actionLabel}</Text>
          <ChevronRight size={14} color={colors.accent} />
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
