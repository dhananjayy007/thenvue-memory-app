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
  Alert,
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
  ArrowLeft,
  Bookmark,
  Share2,
} from 'lucide-react-native'
import type { Memory, MemoryPerspective } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { formatAudioDuration } from '../lib/format'
import { addPerspective } from '../lib/memories'

type PendingPhoto = {
  uri: string
  base64: string
  fileName: string
  fileSize: number
}

const { height } = Dimensions.get('window')

export function PerspectiveComposerModal({
  memory,
  visible,
  colors,
  onClose,
  onSaved,
}: {
  memory: Memory | null
  visible: boolean
  colors: ThemeColors
  onClose: () => void
  onSaved: (perspective: MemoryPerspective, savedToPersonal: boolean) => void
}) {
  const [draft, setDraft] = useState('')
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [saving, setSaving] = useState(false)
  const [showDestinationPrompt, setShowDestinationPrompt] = useState(false)

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
      setShowDestinationPrompt(false)
    } else {
      stopRecordingCleanup()
    }
  }, [visible])

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
      console.error('Photo picker error:', err)
    }
  }

  // Voice Recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Microphone Access', 'Please allow microphone access to record your perspective.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await newRecording.startAsync()

      setRecording(newRecording)
      setIsRecording(true)
      setRecordDuration(0)
      setRecordedUri(null)
      setRecordedBase64(null)

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
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
      console.error('Failed to stop recording:', err)
    }
  }

  if (!memory) return null

  const handleOpenDestinationPrompt = () => {
    if (!draft.trim() && photos.length === 0 && !recordedBase64) {
      Alert.alert('Empty Perspective', 'Please write your perspective or record voice.')
      return
    }
    setShowDestinationPrompt(true)
  }

  const handleFinalSave = async (saveToPersonal: boolean) => {
    setSaving(true)
    try {
      const perspective = await addPerspective({
        memoryId: memory.id,
        text: draft.trim(),
        photos: photos.map((p) => ({
          base64: p.base64,
          fileName: p.fileName,
          fileSize: p.fileSize,
        })),
        audioBase64: recordedBase64 || undefined,
        mimeType: 'audio/m4a',
        saveToPersonalMemory: saveToPersonal,
      })

      onSaved(perspective, saveToPersonal)
      onClose()
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save your perspective.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Add Perspective</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {memory.title || 'Shared Memory'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenDestinationPrompt}
            disabled={saving || (!draft.trim() && photos.length === 0 && !recordedBase64)}
            style={[
              styles.doneBtn,
              { backgroundColor: colors.accent },
              (!draft.trim() && photos.length === 0 && !recordedBase64) && { opacity: 0.4 },
            ]}
          >
            <Text style={styles.doneBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          {/* Main Story Input */}
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="What was your side of the story? Add details, thoughts, or feelings..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={draft}
            onChangeText={setDraft}
            autoFocus
          />

          {/* Voice recording preview / widget */}
          {isRecording ? (
            <View style={[styles.voiceRecordingBox, { backgroundColor: colors.cardSecondary, borderColor: colors.danger }]}>
              <View style={styles.recordingPulse}>
                <View style={[styles.pulseDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.durationText, { color: colors.danger }]}>
                  {formatAudioDuration(recordDuration)}
                </Text>
              </View>
              <Text style={[styles.recordingHint, { color: colors.textMuted }]}>Recording voice perspective...</Text>
              <TouchableOpacity style={[styles.stopBtn, { backgroundColor: colors.danger }]} onPress={stopRecording}>
                <Square size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : recordedUri ? (
            <View style={[styles.voiceReadyBox, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
              <View style={styles.voiceReadyInfo}>
                <Mic size={18} color={colors.accent} />
                <Text style={[styles.voiceReadyText, { color: colors.text }]}>
                  Voice perspective ready ({formatAudioDuration(recordDuration)})
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setRecordedUri(null); setRecordedBase64(null); }}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Photos Grid */}
          {photos.length > 0 ? (
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={photo.uri + index} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Toolbar */}
        <View style={[styles.toolbar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.mediaActions}>
            <TouchableOpacity style={styles.mediaBtn} onPress={handleSnapCamera}>
              <Camera size={20} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={handlePickPhoto}>
              <ImageIcon size={20} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaBtn, isRecording && { backgroundColor: colors.danger }]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Mic size={20} color={isRecording ? '#fff' : colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Destination Modal */}
        {showDestinationPrompt && (
          <Modal visible={showDestinationPrompt} transparent animationType="fade">
            <View style={styles.destOverlay}>
              <View style={[styles.destModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.destHeader}>
                  <Sparkles size={24} color={colors.accent} style={{ alignSelf: 'center', marginBottom: 8 }} />
                  <Text style={[styles.destTitle, { color: colors.text }]}>Save this to your memories too?</Text>
                  <Text style={[styles.destSubtitle, { color: colors.textMuted }]}>
                    Choose how you want to keep this perspective.
                  </Text>
                </View>

                <View style={styles.destOptions}>
                  <TouchableOpacity
                    style={[styles.destCard, { backgroundColor: colors.cardSecondary, borderColor: colors.accent }]}
                    onPress={() => handleFinalSave(true)}
                    disabled={saving}
                  >
                    <View style={styles.destCardTitle}>
                      <Bookmark size={18} color={colors.accent} />
                      <Text style={[styles.destCardTitleText, { color: colors.text }]}>Save to My Memories</Text>
                    </View>
                    <Text style={[styles.destCardDesc, { color: colors.textMuted }]}>
                      Adds to your personal timeline (with a link to the shared memory) AND shares it with everyone.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.destCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                    onPress={() => handleFinalSave(false)}
                    disabled={saving}
                  >
                    <View style={styles.destCardTitle}>
                      <Share2 size={18} color={colors.textSecondary} />
                      <Text style={[styles.destCardTitleText, { color: colors.text }]}>Only Add to Shared Memory</Text>
                    </View>
                    <Text style={[styles.destCardDesc, { color: colors.textMuted }]}>
                      Keeps this contribution strictly inside the shared memory without adding it to your personal timeline.
                    </Text>
                  </TouchableOpacity>
                </View>

                {saving ? (
                  <ActivityIndicator style={{ marginTop: 16 }} color={colors.accent} />
                ) : (
                  <TouchableOpacity style={styles.destCancelBtn} onPress={() => setShowDestinationPrompt(false)}>
                    <Text style={[styles.destCancelText, { color: colors.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    maxWidth: '65%',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  voiceRecordingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  recordingPulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  recordingHint: {
    fontSize: 12,
  },
  stopBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceReadyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  voiceReadyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceReadyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  photoContainer: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mediaActions: {
    flexDirection: 'row',
    gap: 16,
  },
  mediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  destModal: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  destHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  destTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  destSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  destOptions: {
    gap: 12,
  },
  destCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  destCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  destCardTitleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  destCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  destCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  destCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
})
