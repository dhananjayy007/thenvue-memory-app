import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import {
  Film,
  X,
  Plus,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Check,
  Edit3,
  ArrowRight,
  AlertCircle,
} from 'lucide-react-native'
import type { Memory, MemoryClusterCandidate, PastImportQuota } from '../types/memory'
import {
  getPastImportQuotaMobile,
  uploadAndProcessPastPhotosMobile,
  saveRediscoveredMemoryMobile,
  enrichMemoryMobile,
  type MobilePastPhotoInput,
} from '../lib/memories'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export function RediscoverModal({
  isOpen,
  onClose,
  onMemoryCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onMemoryCreated: (memory: Memory) => void
}) {
  const [quota, setQuota] = useState<PastImportQuota>({ used: 0, limit: 50, remaining: 50 })
  const [stage, setStage] = useState<'select' | 'processing' | 'review'>('select')
  const [selectedPhotos, setSelectedPhotos] = useState<
    { uri: string; fileName: string; fileSize: number }[]
  >([])
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing past photos...')
  const [candidates, setCandidates] = useState<MemoryClusterCandidate[]>([])
  const [duplicateCount, setDuplicateCount] = useState<number>(0)
  const [failedCount, setFailedCount] = useState<number>(0)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      getPastImportQuotaMobile().then(setQuota).catch(console.error)
      setStage('select')
      setSelectedPhotos([])
      setCandidates([])
      setDuplicateCount(0)
      setFailedCount(0)
      setErrorMsg(null)
      setEditingId(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePickPhotos = async () => {
    setErrorMsg(null)
    if (quota.remaining <= 0) {
      setErrorMsg("You've reached your 50 past-photo limit.")
      return
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow gallery access to select past photos.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: quota.remaining,
        quality: 0.8,
        base64: false,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked: { uri: string; fileName: string; fileSize: number }[] = []

        for (const asset of result.assets) {
          picked.push({
            uri: asset.uri,
            fileName: asset.fileName || `past_photo_${Date.now()}.jpg`,
            fileSize: asset.fileSize || 150000,
          })
        }

        setSelectedPhotos((prev) => [...prev, ...picked].slice(0, quota.remaining))
      }
    } catch (err: any) {
      setErrorMsg('Failed to select photos.')
    }
  }

  const handleRemovePickedPhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProcessPhotos = async () => {
    if (selectedPhotos.length === 0) return
    setStage('processing')
    setProcessingStatus(`Processing ${selectedPhotos.length} past photo${selectedPhotos.length === 1 ? '' : 's'}...`)

    try {
      const inputs: MobilePastPhotoInput[] = selectedPhotos.map((p) => ({
        uri: p.uri,
        fileName: p.fileName,
        fileSize: p.fileSize,
      }))

      const result = await uploadAndProcessPastPhotosMobile({ photos: inputs })
      setDuplicateCount(result.duplicateCount)
      setFailedCount(result.failedCount)
      setCandidates(result.candidates)
      setStage('review')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process photos.')
      setStage('select')
    }
  }

  const handleSaveCandidate = async (candidate: MemoryClusterCandidate) => {
    if (!candidate.suggestedDate) {
      Alert.alert('Date required', 'Please choose a capture date before saving this memory.')
      setEditingId(candidate.id)
      return
    }

    setSavingId(candidate.id)
    try {
      // P2: Instant save (<300ms)
      const mem = await saveRediscoveredMemoryMobile({
        title: candidate.title,
        story: candidate.summary,
        date: candidate.suggestedDate,
        place: candidate.locationName,
        people: candidate.people,
        topics: candidate.topics,
        mood: candidate.mood,
        storagePaths: candidate.assets.map((a) => a.storagePath),
      })

      // Add to timeline with syncing indicator
      onMemoryCreated(mem)

      // Trigger background enrichment
      enrichMemoryMobile(mem.id, mem.text || '').catch((e) => console.warn('Background enrichment error:', e))

      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
      getPastImportQuotaMobile().then(setQuota).catch(console.error)

      if (candidates.length <= 1) {
        onClose()
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save memory.')
    } finally {
      setSavingId(null)
    }
  }

  const handleDismissCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id))
    if (candidates.length <= 1) {
      onClose()
    }
  }

  const handleUpdateCandidate = (id: string, field: keyof MemoryClusterCandidate, val: any) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)))
  }

  const percentage = Math.min(100, Math.round((quota.used / quota.limit) * 100))

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Film size={16} color="#d78368" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Rediscover Your Past</Text>
                <Text style={styles.headerSubtitle}>
                  {stage === 'select' && `${quota.remaining} past photo slot${quota.remaining === 1 ? '' : 's'} available`}
                  {stage === 'processing' && 'Reconstructing memories...'}
                  {stage === 'review' && 'Review discovered moments'}
                </Text>
              </View>
            </View>
            {stage !== 'processing' && (
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={20} color="#8e8e93" />
              </TouchableOpacity>
            )}
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <AlertCircle size={14} color="#ef4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Stage 1: File Selection */}
          {stage === 'select' && (
            <ScrollView contentContainerStyle={styles.scrollBody}>
              {/* Quota Card */}
              <View style={styles.quotaCard}>
                <View style={styles.quotaTopRow}>
                  <Text style={styles.quotaCardTitle}>Past Photo Limit</Text>
                  <Text style={styles.quotaNumber}>
                    {quota.used} <Text style={styles.quotaLimit}>/ {quota.limit}</Text>
                  </Text>
                </View>
                <View style={styles.quotaBarTrack}>
                  <View style={[styles.quotaBarFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.quotaNote}>
                  {quota.remaining > 0
                    ? `✨ ${quota.remaining} slots remaining · Normal memories are unlimited.`
                    : "⚠️ 50/50 limit reached. Deleting past imports frees slots."}
                </Text>
              </View>

              {/* Pick Button */}
              <TouchableOpacity
                style={styles.pickerBox}
                onPress={handlePickPhotos}
                disabled={quota.remaining === 0}
              >
                <ImageIcon size={32} color="#d78368" />
                <Text style={styles.pickerTitle}>Choose Old Photos</Text>
                <Text style={styles.pickerSub}>Select 1 or multiple photos from your albums</Text>
              </TouchableOpacity>

              {/* Selected Photos Grid */}
              {selectedPhotos.length > 0 && (
                <View style={styles.selectedSection}>
                  <View style={styles.selectedHeader}>
                    <Text style={styles.selectedCountText}>Selected ({selectedPhotos.length})</Text>
                    <TouchableOpacity onPress={() => setSelectedPhotos([])}>
                      <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.photoGrid}>
                    {selectedPhotos.map((item, idx) => (
                      <View key={item.uri + idx} style={styles.gridThumbWrap}>
                        <Image source={{ uri: item.uri }} style={styles.gridThumb} />
                        <TouchableOpacity
                          style={styles.removeBadge}
                          onPress={() => handleRemovePickedPhoto(idx)}
                        >
                          <X size={10} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Process Button */}
              {selectedPhotos.length > 0 && (
                <TouchableOpacity style={styles.solidBtn} onPress={handleProcessPhotos}>
                  <Text style={styles.solidBtnText}>
                    Process {selectedPhotos.length} Past Photo{selectedPhotos.length === 1 ? '' : 's'}
                  </Text>
                  <ArrowRight size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Stage 2: Processing State */}
          {stage === 'processing' && (
            <View style={styles.processingCenter}>
              <ActivityIndicator size="large" color="#d78368" />
              <Text style={styles.procTitle}>Rediscovering your past...</Text>
              <Text style={styles.procSub}>{processingStatus}</Text>
            </View>
          )}

          {/* Stage 3: Candidates Review */}
          {stage === 'review' && (
            <ScrollView contentContainerStyle={styles.scrollBody}>
              {candidates.map((cand) => {
                const isEditing = editingId === cand.id
                const isSaving = savingId === cand.id

                return (
                  <View key={cand.id} style={styles.candidateCard}>
                    {/* Photos strip */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.candPhotosStrip}>
                      {cand.assets.map((asset) => (
                        <Image key={asset.id} source={{ uri: asset.url }} style={styles.candPhoto} />
                      ))}
                    </ScrollView>

                    <View style={styles.candContent}>
                      {isEditing ? (
                        <View style={styles.editForm}>
                          <Text style={styles.inputLabel}>Title</Text>
                          <TextInput
                            style={styles.input}
                            value={cand.title}
                            onChangeText={(t) => handleUpdateCandidate(cand.id, 'title', t)}
                          />
                          <Text style={styles.inputLabel}>Summary</Text>
                          <TextInput
                            style={[styles.input, { height: 60 }]}
                            multiline
                            value={cand.summary}
                            onChangeText={(t) => handleUpdateCandidate(cand.id, 'summary', t)}
                          />
                          <TouchableOpacity
                            style={styles.doneEditBtn}
                            onPress={() => setEditingId(null)}
                          >
                            <Text style={styles.doneEditText}>Done Editing</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View>
                          <View style={styles.candMetaRow}>
                            <View style={styles.badge}>
                              <Calendar size={11} color="#8e8e93" />
                              <Text style={styles.badgeText}>{cand.suggestedDate || 'Past date'}</Text>
                            </View>
                            {cand.locationName ? (
                              <View style={styles.badge}>
                                <MapPin size={11} color="#8e8e93" />
                                <Text style={styles.badgeText}>{cand.locationName}</Text>
                              </View>
                            ) : null}
                            <TouchableOpacity onPress={() => setEditingId(cand.id)}>
                              <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.candTitle}>{cand.title}</Text>
                          <Text style={styles.candSummary}>{cand.summary}</Text>
                        </View>
                      )}

                      {/* Action buttons */}
                      <View style={styles.candActionRow}>
                        <TouchableOpacity
                          style={styles.saveMemoryBtn}
                          disabled={isSaving}
                          onPress={() => handleSaveCandidate(cand)}
                        >
                          <Check size={14} color="#fff" />
                          <Text style={styles.saveMemoryBtnText}>
                            {isSaving ? 'Saving...' : 'Looks Right — Save'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.dismissBtn}
                          onPress={() => handleDismissCandidate(cand.id)}
                        >
                          <Text style={styles.dismissText}>Not a Memory</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )
              })}

              {candidates.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>All discovered moments reviewed!</Text>
                  <TouchableOpacity style={styles.solidBtn} onPress={onClose}>
                    <Text style={styles.solidBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1c1e1d',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282b29',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(215, 131, 104, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f4f0',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
  },
  scrollBody: {
    padding: 16,
  },
  quotaCard: {
    backgroundColor: '#222524',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2f3230',
  },
  quotaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quotaCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f5f4f0',
  },
  quotaNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f5f4f0',
  },
  quotaLimit: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '400',
  },
  quotaBarTrack: {
    height: 6,
    backgroundColor: '#161817',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  quotaBarFill: {
    height: '100%',
    backgroundColor: '#d78368',
  },
  quotaNote: {
    fontSize: 11,
    color: '#8e8e93',
  },
  pickerBox: {
    borderWidth: 1.5,
    borderColor: '#3a3d3b',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222524',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f5f4f0',
    marginTop: 8,
  },
  pickerSub: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
  },
  selectedSection: {
    marginBottom: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f5f4f0',
  },
  clearText: {
    fontSize: 12,
    color: '#ef4444',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridThumbWrap: {
    width: (SCREEN_WIDTH - 64) / 4,
    height: (SCREEN_WIDTH - 64) / 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 2,
  },
  solidBtn: {
    backgroundColor: '#d78368',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  solidBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  processingCenter: {
    padding: 48,
    alignItems: 'center',
  },
  procTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f4f0',
    marginTop: 16,
  },
  procSub: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 6,
  },
  candidateCard: {
    backgroundColor: '#222524',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2f3230',
  },
  candPhotosStrip: {
    padding: 8,
    backgroundColor: '#161817',
  },
  candPhoto: {
    width: 90,
    height: 90,
    borderRadius: 6,
    marginRight: 6,
  },
  candContent: {
    padding: 14,
  },
  candMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2a2e2c',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: '#8e8e93',
  },
  editText: {
    fontSize: 11,
    color: '#d78368',
    marginLeft: 'auto',
  },
  candTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f5f4f0',
    marginBottom: 4,
  },
  candSummary: {
    fontSize: 12,
    color: '#8e8e93',
    lineHeight: 16,
    marginBottom: 12,
  },
  candActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#2f3230',
    paddingTop: 10,
  },
  saveMemoryBtn: {
    backgroundColor: '#d78368',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveMemoryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dismissText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  editForm: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#161817',
    borderRadius: 6,
    padding: 8,
    color: '#f5f4f0',
    fontSize: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2f3230',
  },
  doneEditBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2e2c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  doneEditText: {
    color: '#f5f4f0',
    fontSize: 11,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 16,
  },
})
