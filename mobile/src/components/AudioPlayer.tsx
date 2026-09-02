import React, { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Audio, AVPlaybackStatus } from 'expo-av'
import { Play, Pause } from 'lucide-react-native'
import type { ThemeColors } from '../theme/colors'
import { formatAudioDuration } from '../lib/format'

export function AudioPlayer({
  url,
  colors,
}: {
  url: string
  colors: ThemeColors
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [positionMillis, setPositionMillis] = useState(0)
  const [durationMillis, setDurationMillis] = useState(0)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (sound) {
        sound.unloadAsync().catch(() => {})
      }
    }
  }, [sound])

  const loadAndToggle = async () => {
    try {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        )
        if (isMounted.current) {
          setSound(newSound)
          setIsPlaying(true)
        }
      } else {
        if (isPlaying) {
          await sound.pauseAsync()
          if (isMounted.current) setIsPlaying(false)
        } else {
          if (positionMillis >= durationMillis && durationMillis > 0) {
            await sound.replayAsync()
          } else {
            await sound.playAsync()
          }
          if (isMounted.current) setIsPlaying(true)
        }
      }
    } catch (err) {
      console.warn('Audio playback error:', err)
    }
  }

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return
    if (isMounted.current) {
      setPositionMillis(status.positionMillis)
      setDurationMillis(status.durationMillis || 0)
      setIsPlaying(status.isPlaying)
      if (status.didJustFinish) {
        setIsPlaying(false)
        setPositionMillis(status.durationMillis || 0)
      }
    }
  }

  const progressPercent = durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0

  return (
    <View style={[styles.container, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: colors.accent }]}
        onPress={loadAndToggle}
        activeOpacity={0.8}
      >
        {isPlaying ? (
          <Pause size={18} color="#FFFFFF" />
        ) : (
          <Play size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>

      <View style={styles.trackContainer}>
        <View style={[styles.trackBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.trackFill,
              { width: `${Math.min(100, Math.max(0, progressPercent))}%`, backgroundColor: colors.accent },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {formatAudioDuration(positionMillis)}
          </Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {formatAudioDuration(durationMillis)}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginVertical: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackContainer: {
    flex: 1,
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
})
