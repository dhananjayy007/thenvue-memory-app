import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, Sun, Moon, Plus, Bell, Sparkles } from 'lucide-react-native'
import type { ThemeColors } from '../theme/colors'
import { ThenvueLogo } from './ThenvueLogo'

export function Header({
  colors,
  dark,
  title = 'Thenvue',
  subtitle,
  onToggleTheme,
  onOpenSearch,
  onOpenCapture,
  onOpenNotifications,
  onOpenRediscover,
  unreadNotificationsCount = 0,
}: {
  colors: ThemeColors
  dark: boolean
  title?: string
  subtitle?: string
  onToggleTheme: () => void
  onOpenSearch?: () => void
  onOpenCapture?: () => void
  onOpenNotifications?: () => void
  onOpenRediscover?: () => void
  unreadNotificationsCount?: number
}) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 0) + 8,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.leftBrand}>
        <ThenvueLogo size={32} />
        <Text style={[styles.brandTitle, { color: colors.text }]}>{title}</Text>
      </View>

      <View style={styles.actions}>
        {onOpenRediscover ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onOpenRediscover} activeOpacity={0.7}>
            <Sparkles size={18} color={colors.accent} />
          </TouchableOpacity>
        ) : null}

        {onOpenSearch ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onOpenSearch} activeOpacity={0.7}>
            <Search size={18} color={colors.text} />
          </TouchableOpacity>
        ) : null}

        {onOpenNotifications ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onOpenNotifications} activeOpacity={0.7}>
            <Bell size={18} color={colors.text} />
            {unreadNotificationsCount > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.unreadBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.actionBtn} onPress={onToggleTheme} activeOpacity={0.7}>
          {dark ? <Sun size={18} color={colors.text} /> : <Moon size={18} color={colors.text} />}
        </TouchableOpacity>

        {onOpenCapture ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onOpenCapture} activeOpacity={0.7}>
            <Plus size={20} color={colors.accent} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
})
