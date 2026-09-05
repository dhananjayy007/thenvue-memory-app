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
  InteractionManager,
  Keyboard,
} from 'react-native'
import { Audio } from 'expo-av'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import * as Location from 'expo-location'
import {
  Camera,
  Image as ImageIcon,
  Mic,
  X,
  Square,
  Sparkles,
  MapPin,
  CalendarDays,
  Check,
  FileText,
} from 'lucide-react-native'
import type { ThemeColors } from '../theme/colors'
import { formatAudioDuration } from '../lib/format'
import { MentionAutocomplete } from './MentionAutocomplete'

type PendingPhoto = {
  uri: string
  base64: string
  fileName: string
  fileSize: number
  isPdf?: boolean
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
  onSaveText: (
    draft: string,
    photos: { base64: string; fileName: string; fileSize: number }[],
    options?: { customPlace?: string; customDate?: string; customTime?: string }
  ) => Promise<void>
  onSaveVoice: (
    audioBase64: string,
    fileName: string,
    fileSize: number,
    options?: { customPlace?: string; customDate?: string; customTime?: string }
  ) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<TextInput | null>(null)

  // Location & Date
  const [showPlaceInput, setShowPlaceInput] = useState(false)
  const [customPlace, setCustomPlace] = useState('')
  const [locating, setLocating] = useState(false)
  const [showDateInput, setShowDateInput] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  // Voice state
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [recordedUri, setRecordedUri] = useState<string | null>(null)
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null)
  const timerRef = useRef<any>(null)

  const fetchCurrentGpsLocation = async (promptPermission = false) => {
    try {
      setLocating(true)
      let { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted' && promptPermission) {
        const permissionRes = await Location.requestForegroundPermissionsAsync()
        status = permissionRes.status
      }

      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        if (position?.coords) {
          const geocoded = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })

          if (geocoded && geocoded.length > 0) {
            const place = geocoded[0]
            const namePart = place.name && !/^\d+$/.test(place.name) ? place.name : place.street || ''
            const locality = place.district || place.subregion || place.city || ''
            const region = place.region || place.country || ''

            const parts = [namePart, locality, region].filter(Boolean)
            const resolved = Array.from(new Set(parts)).join(', ')

            if (resolved) {
              setCustomPlace(resolved)
            }
          }
        }
      }
    } catch (err) {
      console.log('GPS fetch error:', err)
    } finally {
      setLocating(false)
    }
  }

  useEffect(() => {
    if (visible) {
      setDraft('')
      setPhotos([])
      setRecordedUri(null)
      setRecordedBase64(null)
      setRecordDuration(0)
      setIsRecording(false)
      setShowPlaceInput(false)
      setCustomPlace('')
      setShowDateInput(false)
      setCustomDate('')
      setCustomTime('')

      // Defer GPS and focus after modal slide animation completes for 60fps smoothness
      const task = InteractionManager.runAfterInteractions(() => {
        fetchCurrentGpsLocation(false)
        if (initialMode === 'text') {
          setTimeout(() => inputRef.current?.focus(), 120)
        } else if (initialMode === 'photo') {
          handlePickPhoto()
        } else if (initialMode === 'voice') {
          startRecording()
        }
      })

      return () => {
        task.cancel()
      }
    } else {
      Keyboard.dismiss()
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

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        setPhotos((prev) => [
          ...prev,
          {
            uri: asset.uri,
            base64: asset.base64 || '',
            fileName: asset.fileName || `camera_${Date.now()}.jpg`,
            fileSize: asset.fileSize || 100000,
          },
        ])
      }
    } catch (err) {
      console.error('Camera error:', err)
    }
  }

  // Pick Photo from Gallery
  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') return

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets) {
        const mapped: PendingPhoto[] = result.assets.map((asset) => ({
          uri: asset.uri,
          base64: asset.base64 || '',
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          fileSize: asset.fileSize || 100000,
          isPdf: false,
        }))
        setPhotos((prev) => [...prev, ...mapped])
      }
    } catch (err) {
      console.error('Pick photo error:', err)
    }
  }

  // Pick Document / PDF
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0]
        let base64 = ''
        if (asset.uri) {
          try {
            const fileData = await fetch(asset.uri)
            const blob = await fileData.blob()
            const reader = new FileReader()
            base64 = await new Promise((resolve) => {
              reader.onloadend = () => {
                const r = reader.result as string
                resolve(r.split(',')[1] || '')
              }
              reader.readAsDataURL(blob)
            })
          } catch {}
        }
        const newPhoto: PendingPhoto = {
          uri: asset.uri,
          base64,
          fileName: asset.name || 'document.pdf',
          fileSize: asset.size || 150000,
          isPdf: asset.mimeType?.includes('pdf') || asset.name?.toLowerCase().endsWith('.pdf'),
        }
        setPhotos((prev) => [...prev, newPhoto])
      }
    } catch (err) {
      console.warn('Pick document error:', err)
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
      const options = {
        customPlace: customPlace.trim() || undefined,
        customDate: customDate.trim() || undefined,
        customTime: customTime.trim() || undefined,
      }

      if (recordedBase64 && !draft.trim()) {
        await onSaveVoice(recordedBase64, `voice_${Date.now()}.m4a`, 200000, options)
      } else {
        await onSaveText(
          draft,
          photos.map((p) => ({
            base64: p.base64,
            fileName: p.fileName,
            fileSize: p.fileSize,
          })),
          options
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

  const handleClose = () => {
    Keyboard.dismiss()
    onClose()
  }

  const now = new Date()
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header Row: Close on left, Date pill on right */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.datePill, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
              onPress={() => {
                setShowDateInput((prev) => !prev)
                if (showPlaceInput) setShowPlaceInput(false)
              }}
              activeOpacity={0.8}
            >
              <CalendarDays size={13} color={colors.textMuted} />
              <Text style={[styles.datePillText, { color: colors.textSecondary }]}>{dateFormatted}</Text>
            </TouchableOpacity>
          </View>

          {/* Text & Content Area */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Prompt */}
            <Text style={[styles.promptText, { color: colors.accent }]}>How was your day?</Text>

            {/* Serif Title */}
            <Text style={[styles.titleHeading, { color: colors.text }]}>What happened?</Text>

            {/* Subtitle / Text Input */}
            <TextInput
              ref={inputRef}
              style={[styles.textarea, { color: colors.text }]}
              placeholder="Type @ to tag a friend"
              placeholderTextColor={colors.textMuted}
              multiline
              value={draft}
              onChangeText={setDraft}
            />

            {/* Live @Mention Autocomplete Dropdown */}
            <MentionAutocomplete
              text={draft}
              colors={colors}
              onSelectUser={(u) => {
                const handle = u.email ? u.email.split('@')[0] : u.displayName.toLowerCase().replace(/\s+/g, '')
                setDraft((prev) => prev.replace(/@[a-zA-Z0-9_-]*$/, `@${handle} `))
              }}
            />

            {/* Attached Photos & Documents Strip */}
            {photos.length > 0 && (
              <View style={styles.photoStrip}>
                {photos.map((photo, i) => (
                  <View key={i} style={styles.photoThumb}>
                    {photo.isPdf ? (
                      <View style={[styles.pdfThumbBox, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                        <FileText size={18} color={colors.accent} />
                        <Text style={[styles.pdfThumbText, { color: colors.textMuted }]} numberOfLines={1}>
                          {photo.fileName}
                        </Text>
                      </View>
                    ) : (
                      <Image source={{ uri: photo.uri }} style={styles.photoImg} />
                    )}
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

            {/* Location input row / active chip */}
            {showPlaceInput ? (
              <View style={[styles.inlineInputRow, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}>
                <MapPin size={14} color={colors.accent} />
                <TextInput
                  style={[styles.inlineTextInput, { color: colors.text }]}
                  placeholder="Enter location (e.g., Central Park, NYC)"
                  placeholderTextColor={colors.textMuted}
                  value={customPlace}
                  onChangeText={setCustomPlace}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPlaceInput(false)} style={styles.inlineDoneBtn}>
                  <Check size={14} color={colors.accent} />
                </TouchableOpacity>
              </View>
            ) : locating ? (
              <View style={styles.activeChipsRow}>
                <View style={[styles.activeChip, { backgroundColor: 'rgba(229, 115, 115, 0.1)', borderColor: 'rgba(229, 115, 115, 0.25)' }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.activeChipText, { color: colors.accent }]}>Detecting location...</Text>
                </View>
              </View>
            ) : customPlace ? (
              <View style={styles.activeChipsRow}>
                <View style={[styles.activeChip, { backgroundColor: 'rgba(229, 115, 115, 0.15)', borderColor: 'rgba(229, 115, 115, 0.3)' }]}>
                  <MapPin size={12} color={colors.accent} />
                  <Text style={[styles.activeChipText, { color: colors.accent }]}>{customPlace}</Text>
                  <TouchableOpacity onPress={() => setCustomPlace('')}>
                    <X size={12} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Date input row / active chip */}
            {showDateInput ? (
              <View style={[styles.inlineInputRow, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}>
                <CalendarDays size={14} color={colors.accent} />
                <TextInput
                  style={[styles.inlineTextInput, { color: colors.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={customDate}
                  onChangeText={setCustomDate}
                />
                <TextInput
                  style={[styles.inlineTimeInput, { color: colors.text }]}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textMuted}
                  value={customTime}
                  onChangeText={setCustomTime}
                />
                <TouchableOpacity onPress={() => setShowDateInput(false)} style={styles.inlineDoneBtn}>
                  <Check size={14} color={colors.accent} />
                </TouchableOpacity>
              </View>
            ) : customDate ? (
              <View style={styles.activeChipsRow}>
                <View style={[styles.activeChip, { backgroundColor: 'rgba(229, 115, 115, 0.15)', borderColor: 'rgba(229, 115, 115, 0.3)' }]}>
                  <CalendarDays size={12} color={colors.accent} />
                  <Text style={[styles.activeChipText, { color: colors.accent }]}>
                    {customDate} {customTime ? `· ${customTime}` : ''}
                  </Text>
                  <TouchableOpacity onPress={() => { setCustomDate(''); setCustomTime('') }}>
                    <X size={12} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* 5 Symmetrical Rounded Tool Tiles */}
          <View style={styles.tilesRow}>
            {/* Tile 1: Photo */}
            <TouchableOpacity
              style={[styles.toolTile, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
              onPress={handleSnapCamera}
              activeOpacity={0.7}
              accessibilityLabel="Photo"
            >
              <Camera size={20} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={[styles.toolTileLabel, { color: colors.textMuted }]}>Photo</Text>
            </TouchableOpacity>

            {/* Tile 2: Gallery / Doc */}
            <TouchableOpacity
              style={[styles.toolTile, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
              onPress={handlePickPhoto}
              onLongPress={handlePickDocument}
              activeOpacity={0.7}
              accessibilityLabel="Gallery or Doc"
            >
              <ImageIcon size={20} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={[styles.toolTileLabel, { color: colors.textMuted }]}>Gallery</Text>
            </TouchableOpacity>

            {/* Tile 3: Voice */}
            <TouchableOpacity
              style={[
                styles.toolTile,
                { borderColor: isRecording || recordedUri ? colors.danger : colors.border, backgroundColor: colors.cardSecondary },
                isRecording ? { backgroundColor: 'rgba(239, 68, 68, 0.15)' } : null,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              activeOpacity={0.7}
              accessibilityLabel="Voice"
            >
              <Mic size={20} color={isRecording ? colors.danger : colors.textSecondary} strokeWidth={1.8} />
              <Text style={[styles.toolTileLabel, { color: isRecording ? colors.danger : colors.textMuted }]}>Voice</Text>
            </TouchableOpacity>

            {/* Tile 4: Location */}
            <TouchableOpacity
              style={[
                styles.toolTile,
                { borderColor: customPlace || showPlaceInput || locating ? colors.accent : colors.border, backgroundColor: colors.cardSecondary },
                customPlace || showPlaceInput || locating ? { backgroundColor: 'rgba(229, 115, 115, 0.12)' } : null,
              ]}
              onPress={() => {
                if (!customPlace && !showPlaceInput && !locating) {
                  fetchCurrentGpsLocation(true)
                } else {
                  setShowPlaceInput((prev) => !prev)
                  if (showDateInput) setShowDateInput(false)
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel="Location"
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <MapPin size={20} color={customPlace || showPlaceInput ? colors.accent : colors.textSecondary} strokeWidth={1.8} />
              )}
              <Text style={[styles.toolTileLabel, { color: customPlace || showPlaceInput || locating ? colors.accent : colors.textMuted }]}>
                {locating ? 'GPS...' : 'Location'}
              </Text>
            </TouchableOpacity>

            {/* Tile 5: Date */}
            <TouchableOpacity
              style={[
                styles.toolTile,
                { borderColor: customDate || showDateInput ? colors.accent : colors.border, backgroundColor: colors.cardSecondary },
                customDate || showDateInput ? { backgroundColor: 'rgba(229, 115, 115, 0.12)' } : null,
              ]}
              onPress={() => {
                if (!customDate) {
                  const n = new Date()
                  setCustomDate([n.getFullYear(), String(n.getMonth() + 1).padStart(2, '0'), String(n.getDate()).padStart(2, '0')].join('-'))
                  setCustomTime(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`)
                }
                setShowDateInput((prev) => !prev)
                if (showPlaceInput) setShowPlaceInput(false)
              }}
              activeOpacity={0.7}
              accessibilityLabel="Date"
            >
              <CalendarDays size={20} color={customDate || showDateInput ? colors.accent : colors.textSecondary} strokeWidth={1.8} />
              <Text style={[styles.toolTileLabel, { color: customDate || showDateInput ? colors.accent : colors.textMuted }]}>Date</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Save Memory Button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: '#724335',
                opacity: saving || (!draft.trim() && photos.length === 0 && !recordedBase64) ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving || (!draft.trim() && photos.length === 0 && !recordedBase64)}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: height * 0.94,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '400',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '400',
  },
  scrollArea: {
    maxHeight: 250,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 13,
    fontWeight: '400',
  },
  titleHeading: {
    fontSize: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '400',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  textarea: {
    minHeight: 40,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 4,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  tagPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagPillPlus: {
    fontSize: 13,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '400',
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
  pdfThumbBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  pdfThumbText: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
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
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
  },
  inlineTextInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  inlineTimeInput: {
    width: 60,
    fontSize: 13,
    padding: 0,
  },
  inlineDoneBtn: {
    padding: 4,
  },
  activeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 14,
    marginBottom: 14,
  },
  toolTile: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  toolTileLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '400',
  },
  inferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  inferenceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
})
