import React, { useState, useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native'
import { Audio } from 'expo-av'
import * as ImagePicker from 'expo-image-picker'
import {
  Camera,
  Image as ImageIcon,
  Mic,
  X,
  Square,
  Sparkles,
} from 'lucide-react-native'
import type { ThemeColors } from '../theme/colors'
import { formatAudioDuration } from '../lib/format'

type PendingPhoto = {
  uri: string
  base64: string
  fileName: string
  fileSize: number
}

const { height } = Dimensions.get('window')

export function CaptureModal({
  visible,
  initialMode = 'text',
  colors,
  onClose,
  onSaveText,
  onSaveVoice,
}: {
  visible: boolean
  initialMode?: 'text' | 'voice' | 'photo'
  colors: ThemeColors
  onClose: () => void
  onSaveText: (draft: string, photos: { base64: string; fileName: string; fileSize: number }[]) => Promise<void>
  onSaveVoice: (audioBase64: string, fileName: string, fileSize: number) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [saving, setSaving] = useState(false)

  // Voice state
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [recordedUri, setRecordedUri] = useState<string | null>(null)
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    if (visible) {
      setDraft('')
      setPhotos([])
      setRecordedUri(null)
      setRecordedBase64(null)
      setRecordDuration(0)
      setIsRecording(false)

      if (initialMode === 'photo') {
        handlePickPhoto()
      } else if (initialMode === 'voice') {
        startRecording()
      }
    } else {
      stopRecordingCleanup()
    }
  }, [visible, initialMode])

  const stopRecordingCleanup = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (recording) {
      try {
        await recording.stopAndUnloadAsync()
      } catch {}
      setRecording(null)
    }
    setIsRecording(false)
  }

  // Camera Snapshot
  const handleSnapCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') return

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0]
        setPhotos((prev) => [
          ...prev,
          {
            uri: asset.uri,
            base64: asset.base64!,
            fileName: asset.fileName || `camera_${Date.now()}.jpg`,
            fileSize: asset.fileSize || 100000,
          },
        ])
      }
    } catch (err) {
      console.error('Camera error:', err)
    }
  }

  // Photo Library
  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') return

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled) {
        const newPhotos: PendingPhoto[] = []
        for (const asset of result.assets) {
          if (asset.base64) {
            newPhotos.push({
              uri: asset.uri,
              base64: asset.base64,
              fileName: asset.fileName || `photo_${Date.now()}.jpg`,
              fileSize: asset.fileSize || 100000,
            })
          }
        }
        setPhotos((prev) => [...prev, ...newPhotos])
      }
    } catch (err) {
      console.error('Pick photo error:', err)
    }
  }

  // Audio Recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') return

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const rec = new Audio.Recording()
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await rec.startAsync()
      setRecording(rec)
      setIsRecording(true)
      setRecordDuration(0)

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Start recording error:', err)
    }
  }

  const stopRecording = async () => {
    if (!recording) return
    try {
      if (timerRef.current) clearInterval(timerRef.current)
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecordedUri(uri)
      setIsRecording(false)

      if (uri) {
        const response = await fetch(uri)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          const base64data = reader.result as string
          const raw = base64data.split(',')[1] || ''
          setRecordedBase64(raw)
        }
      }
    } catch (err) {
      console.error('Stop recording error:', err)
    }
  }

  // Save Action
  const handleSave = async () => {
    if (saving) return
    if (!draft.trim() && photos.length === 0 && !recordedBase64) return

    setSaving(true)
    try {
      if (recordedBase64 && !draft.trim()) {
        await onSaveVoice(recordedBase64, `voice_${Date.now()}.m4a`, 200000)
      } else {
        await onSaveText(
          draft,
          photos.map((p) => ({
            base64: p.base64,
            fileName: p.fileName,
            fileSize: p.fileSize,
          }))
        )
      }
      onClose()
    } catch (err) {
      console.error('Save memory error:', err)
    } finally {
      setSaving(false)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const now = new Date()
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: colors.textMuted }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{dateFormatted}</Text>
          </View>

          {/* Text Input */}
          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            <TextInput
              style={[styles.textarea, { color: colors.text }]}
              placeholder="Write something you want to remember..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
              value={draft}
              onChangeText={setDraft}
            />

            {/* Attached Photos Strip */}
            {photos.length > 0 && (
              <View style={styles.photoStrip}>
                {photos.map((photo, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImg} />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => removePhoto(i)}
                      activeOpacity={0.8}
                    >
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Voice Recording Pill */}
            {(isRecording || recordedUri) && (
              <View
                style={[
                  styles.voicePill,
                  { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                ]}
              >
                <View style={[styles.recordingIndicator, { backgroundColor: colors.danger }]} />
                <Text style={[styles.voiceDuration, { color: colors.text }]}>
                  {formatAudioDuration(recordDuration)}
                </Text>
                {isRecording ? (
                  <TouchableOpacity
                    style={[styles.voiceActionBtn, { backgroundColor: colors.danger }]}
                    onPress={stopRecording}
                    activeOpacity={0.8}
                  >
                    <Square size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.voiceActionBtn, { backgroundColor: colors.pill }]}
                    onPress={() => {
                      setRecordedUri(null)
                      setRecordedBase64(null)
                      setRecordDuration(0)
                    }}
                    activeOpacity={0.8}
                  >
                    <X size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

          {/* Tools Bar */}
          <View style={[styles.toolsBar, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.toolBtn, { borderColor: colors.border }]} onPress={handlePickPhoto}>
              <ImageIcon size={14} color={colors.textMuted} />
              <Text style={[styles.toolText, { color: colors.textMuted }]}>Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toolBtn, { borderColor: colors.border }]} onPress={handleSnapCamera}>
              <Camera size={14} color={colors.textMuted} />
              <Text style={[styles.toolText, { color: colors.textMuted }]}>Camera</Text>
            </TouchableOpacity>

            {!isRecording && !recordedUri ? (
              <TouchableOpacity style={[styles.toolBtn, { borderColor: colors.border }]} onPress={startRecording}>
                <Mic size={14} color={colors.textMuted} />
                <Text style={[styles.toolText, { color: colors.textMuted }]}>Speak</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* AI Status / Inference */}
          {saving && (
            <View style={styles.inferenceRow}>
              <Sparkles size={14} color={colors.accent} />
              <Text style={[styles.inferenceText, { color: colors.accent }]}>
                Remembering people, places, and connections...
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: colors.accent,
                opacity: saving || (!draft.trim() && photos.length === 0 && !recordedBase64) ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving || (!draft.trim() && photos.length === 0 && !recordedBase64)}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#211d1a" />
            ) : (
              <Text style={styles.saveBtnText}>Save Memory</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    maxHeight: height * 0.92,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  closeText: {
    fontSize: 13,
  },
  dateText: {
    fontSize: 12,
  },
  scrollArea: {
    maxHeight: 280,
  },
  textarea: {
    minHeight: 180,
    fontSize: 21,
    lineHeight: 30,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
  photoStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  photoThumb: {
    width: 68,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
    gap: 8,
    marginVertical: 8,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  voiceDuration: {
    fontSize: 13,
    fontWeight: '600',
  },
  voiceActionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsBar: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toolText: {
    fontSize: 11,
  },
  inferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  inferenceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  saveBtn: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#211d1a',
    fontSize: 14,
    fontWeight: '600',
  },
})
