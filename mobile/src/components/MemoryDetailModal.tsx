import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import {
  ArrowLeft,
  Trash2,
  MapPin,
  Users,
  Sparkles,
  ChevronRight,
  UserPlus,
  Share2,
  Plus,
  Compass,
  MoreHorizontal,
  X,
  Edit3,
  FileText,
  Check,
} from 'lucide-react-native'
import type { Memory, ConnectedMemory, MemoryPerspective } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { formatDate, formatTime } from '../lib/format'
import { AudioPlayer } from './AudioPlayer'
import { getConnectedMemories, updateMemory, deleteMedia } from '../lib/memories'
import { FeatureTip } from './FeatureTip'

export function MemoryDetailModal({
  memory,
  allMemories,
  colors,
  visible,
  onClose,
  onDelete,
  onSelectConnected,
  onInvitePeople,
  onAddPerspective,
  onDeletePerspective,
  onUpdateMemory,
}: {
  memory: Memory | null
  allMemories: Memory[]
  colors: ThemeColors
  visible: boolean
  onClose: () => void
  onDelete: (id: string) => Promise<void>
  onSelectConnected: (m: Memory) => void
  onInvitePeople?: (m: Memory) => void
  onAddPerspective?: (m: Memory) => void
  onDeletePerspective?: (perspectiveId: string) => Promise<void>
  onUpdateMemory?: (updated: Memory) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editText, setEditText] = useState('')
  const [editPlace, setEditPlace] = useState('')
  const [editDate, setEditDate] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  if (!memory) return null

  const photos = memory.media.filter((m) => m.mediaType === 'image')
  const audio = memory.media.find((m) => m.mediaType === 'audio')
  const documents = memory.media.filter((m) => m.mediaType === 'document' || m.fileName?.toLowerCase().endsWith('.pdf'))
  const connected = getConnectedMemories(memory, allMemories, 3)
  const participants = memory.participants || []
  const perspectives = memory.perspectives || []
  const isOwner = memory.isOwner !== false

  const startEditing = () => {
    setShowMenu(false)
    setEditTitle(memory.title || '')
    setEditText(memory.text || '')
    setEditPlace(memory.place || '')
    setEditDate(memory.date || '')
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      Alert.alert('Story required', 'Please enter some text for your memory.')
      return
    }
    setIsSavingEdit(true)
    try {
      const updated = await updateMemory(memory.id, {
        title: editTitle.trim() || undefined,
        text: editText.trim(),
        place: editPlace.trim(),
        date: editDate.trim() || undefined,
      })
      setIsEditing(false)
      if (onUpdateMemory) onUpdateMemory(updated)
    } catch (e: any) {
      Alert.alert('Error updating memory', e?.message || 'Please try again.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const confirmDelete = () => {
    setShowMenu(false)
    Alert.alert(
      'Delete memory?',
      'This will permanently delete this memory and any attached photos and voice recordings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            onClose()
            await onDelete(memory.id)
          },
        },
      ]
    )
  }

  const confirmDeletePerspective = (perspectiveId: string) => {
    Alert.alert(
      'Remove perspective?',
      'Are you sure you want to remove your perspective from this memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (onDeletePerspective) {
              await onDeletePerspective(perspectiveId)
            }
          },
        },
      ]
    )
  }

  const confirmDeleteMedia = (mediaId: string) => {
    Alert.alert(
      'Delete attachment?',
      'Are you sure you want to remove this attachment from the memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedia(mediaId)
              const updatedMedia = memory.media.filter((m) => m.id !== mediaId)
              if (onUpdateMemory) {
                onUpdateMemory({ ...memory, media: updatedMedia })
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not delete attachment.')
            }
          },
        },
      ]
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEditing ? 'Edit Memory' : 'Memory'}
          </Text>
          <View style={styles.headerActions}>
            {isEditing ? (
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={[styles.saveEditBtn, { backgroundColor: colors.accent }]}
                disabled={isSavingEdit}
                activeOpacity={0.8}
              >
                {isSavingEdit ? (
                  <ActivityIndicator size="small" color="#211d1a" />
                ) : (
                  <Check size={16} color="#211d1a" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowMenu(true)}
                style={styles.headerBtn}
                activeOpacity={0.7}
                accessibilityLabel="More options"
              >
                <MoreHorizontal size={20} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Shared Context Origin Badge */}
          {memory.sharedContext ? (
            <View style={[styles.sharedContextBadge, { backgroundColor: colors.pill, borderColor: colors.accent }]}>
              <Share2 size={12} color={colors.accent} />
              <Text style={[styles.sharedContextText, { color: colors.accent }]}>{memory.sharedContext}</Text>
            </View>
          ) : null}

          {/* Edit Mode Form vs View Mode */}
          {isEditing ? (
            <View style={styles.editContainer}>
              <Text style={[styles.editLabel, { color: colors.textMuted }]}>TITLE</Text>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Memory Title"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.editLabel, { color: colors.textMuted }]}>LOCATION</Text>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
                value={editPlace}
                onChangeText={setEditPlace}
                placeholder="Where did this happen?"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.editLabel, { color: colors.textMuted }]}>DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.editLabel, { color: colors.textMuted }]}>STORY</Text>
              <TextInput
                style={[styles.editTextarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
                value={editText}
                onChangeText={setEditText}
                placeholder="What happened?"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <View style={styles.editActionRow}>
                <TouchableOpacity
                  style={[styles.cancelEditBtn, { borderColor: colors.border }]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={[styles.cancelEditBtnText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmSaveBtn, { backgroundColor: colors.accent }]}
                  onPress={handleSaveEdit}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? (
                    <ActivityIndicator size="small" color="#211d1a" />
                  ) : (
                    <Text style={styles.confirmSaveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Photos */}
              {photos.length === 1 ? (
                <View style={styles.singleImageWrapper}>
                  <Image
                    source={{ uri: photos[0].url, cacheKey: photos[0].url }}
                    style={styles.singleImage}
                    contentFit="cover"
                    transition={0}
                    cachePolicy="memory-disk"
                  />
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.mediaDeleteBtn}
                      onPress={() => confirmDeleteMedia(photos[0].id)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : photos.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                  {photos.map((p) => (
                    <View key={p.id} style={styles.galleryImageWrapper}>
                      <Image
                        source={{ uri: p.url, cacheKey: p.url }}
                        style={styles.galleryImage}
                        contentFit="cover"
                        transition={0}
                        cachePolicy="memory-disk"
                      />
                      {isOwner && (
                        <TouchableOpacity
                          style={styles.mediaDeleteBtn}
                          onPress={() => confirmDeleteMedia(p.id)}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={11} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : null}

              {/* Documents / PDFs Section */}
              {documents.length > 0 && (
                <View style={styles.documentsContainer}>
                  {documents.map((doc) => (
                    <View
                      key={doc.id}
                      style={[styles.documentCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                    >
                      <FileText size={20} color={colors.accent} />
                      <View style={styles.documentInfo}>
                        <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
                          {doc.fileName || 'Attached Document.pdf'}
                        </Text>
                        <Text style={[styles.documentMeta, { color: colors.textMuted }]}>
                          PDF Document · {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Attached'}
                        </Text>
                      </View>
                      {isOwner && (
                        <TouchableOpacity
                          onPress={() => confirmDeleteMedia(doc.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={14} color={colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Audio player if voice recording */}
              {audio ? (
                <View style={styles.audioWrapper}>
                  <AudioPlayer url={audio.url} colors={colors} />
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.audioDeleteBtn}
                      onPress={() => confirmDeleteMedia(audio.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={13} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}

              {/* Meta Date */}
              <Text style={[styles.dateText, { color: colors.accent }]}>
                {formatDate(memory.date)} · {formatTime(memory.time)}
              </Text>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>{memory.title}</Text>

              {/* AI Summary */}
              {memory.summary ? (
                <View style={[styles.summaryBox, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                  <View style={styles.summaryBadge}>
                    <Sparkles size={12} color={colors.accent} />
                    <Text style={[styles.summaryBadgeText, { color: colors.accent }]}>AI Understanding</Text>
                  </View>
                  <Text style={[styles.summaryText, { color: colors.text }]}>{memory.summary}</Text>
                </View>
              ) : null}

              {/* Body */}
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                {audio ? 'Transcription' : 'Original Writing'}
              </Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>{memory.text}</Text>

              {/* Tags */}
              <View style={styles.tagsContainer}>
                {memory.place ? (
                  <View style={[styles.tagPill, { backgroundColor: colors.pill, borderColor: colors.border }]}>
                    <MapPin size={13} color={colors.accent} />
                    <Text style={[styles.tagText, { color: colors.text }]}>{memory.place}</Text>
                  </View>
                ) : null}

                {memory.people.map((person) => (
                  <View key={person} style={[styles.tagPill, { backgroundColor: colors.pill, borderColor: colors.border }]}>
                    <Users size={13} color={colors.textSecondary} />
                    <Text style={[styles.tagText, { color: colors.text }]}>{person}</Text>
                  </View>
                ))}

                {memory.topics.map((topic) => (
                  <View key={topic} style={[styles.tagPill, { backgroundColor: colors.pill, borderColor: colors.border }]}>
                    <Sparkles size={13} color={colors.textSecondary} />
                    <Text style={[styles.tagText, { color: colors.text }]}>{topic}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Participants Bar */}
          {participants.length > 0 ? (
            <View style={[styles.participantsBar, { backgroundColor: colors.cardSecondary }]}>
              <Text style={[styles.participantsTitle, { color: colors.textMuted }]}>Participants</Text>
              <View style={styles.participantsChips}>
                {participants.map((p) => (
                  <View key={p.id} style={[styles.participantChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.pAvatar, { backgroundColor: colors.accent }]}>
                      <Text style={styles.pAvatarText}>{p.displayName[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    <Text style={[styles.pName, { color: colors.text }]}>{p.displayName}</Text>
                    <Text style={[styles.pStatus, { color: p.status === 'accepted' ? '#10b981' : '#f59e0b' }]}>
                      {p.status}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Compact Perspectives Section (Matching Web) */}
          <View style={[styles.perspectivesSection, { borderTopColor: colors.border }]}>
            <View style={styles.perspectivesHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.perspectivesTitle, { color: colors.text }]}>
                  Perspectives {perspectives.length > 0 ? `(${perspectives.length})` : ''}
                </Text>
                <Text style={[styles.perspectivesSubtitle, { color: colors.textMuted }]}>
                  One moment. Multiple perspectives.
                </Text>
              </View>
              {onInvitePeople ? (
                <TouchableOpacity
                  style={[styles.collabIconButton, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
                  onPress={() => onInvitePeople(memory)}
                  accessibilityLabel="Invite friends"
                  activeOpacity={0.7}
                >
                  <UserPlus size={15} color={colors.accent} />
                </TouchableOpacity>
              ) : null}
            </View>

            {perspectives.length > 0 ? (
              perspectives.map((perspective) => {
                const pPhotos = perspective.media.filter((m) => m.mediaType === 'image')
                const pAudio = perspective.media.find((m) => m.mediaType === 'audio')

                return (
                  <View
                    key={perspective.id}
                    style={[styles.perspectiveCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  >
                    <View style={styles.perspectiveCardHeader}>
                      <View style={styles.perspectiveAuthor}>
                        <View style={[styles.perspectiveAvatar, { backgroundColor: colors.accent }]}>
                          <Text style={styles.pAvatarText}>
                            {perspective.authorName[0]?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.perspectiveAuthorName, { color: colors.text }]}>
                            {perspective.authorName}
                          </Text>
                          {perspective.place ? (
                            <Text style={[styles.perspectivePlace, { color: colors.textMuted }]}>
                              {perspective.place}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {perspective.isAuthor && onDeletePerspective ? (
                        <TouchableOpacity
                          onPress={() => confirmDeletePerspective(perspective.id)}
                          style={styles.perspectiveDeleteBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={13} color={colors.danger} />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Perspective Photos */}
                    {pPhotos.length === 1 ? (
                      <Image
                        source={{ uri: pPhotos[0].url, cacheKey: pPhotos[0].url }}
                        style={styles.perspectiveSingleImage}
                        contentFit="cover"
                        transition={0}
                        cachePolicy="memory-disk"
                      />
                    ) : pPhotos.length > 1 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.perspectiveGallery}>
                        {pPhotos.map((p) => (
                          <Image
                            key={p.id}
                            source={{ uri: p.url, cacheKey: p.url }}
                            style={styles.perspectiveGalleryThumb}
                            contentFit="cover"
                            transition={0}
                            cachePolicy="memory-disk"
                          />
                        ))}
                      </ScrollView>
                    ) : null}

                    {/* Perspective Audio */}
                    {pAudio ? <AudioPlayer url={pAudio.url} colors={colors} /> : null}

                    {/* Perspective Text */}
                    {perspective.text ? (
                      <Text style={[styles.perspectiveText, { color: colors.text }]}>
                        {perspective.text}
                      </Text>
                    ) : null}

                    {/* Perspective Tags */}
                    {perspective.topics.length > 0 ? (
                      <View style={styles.perspectiveTagsContainer}>
                        {perspective.topics.map((t) => (
                          <View key={t} style={[styles.perspectiveTagPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.perspectiveTagText, { color: colors.textMuted }]}>#{t}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                )
              })
            ) : null}
          </View>

          {/* Connected Memories */}
          <View style={[styles.connectedSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.connectedHeader, { color: colors.text }]}>Connected Memories</Text>
            {connected.length > 0 ? (
              connected.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.connectedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => onSelectConnected(item)}
                >
                  <View style={styles.connectedLeft}>
                    <Text style={[styles.connectedReason, { color: colors.accent }]}>
                      {item.relationshipType === 'people' && 'Shared Person'}
                      {item.relationshipType === 'place' && 'Same Place'}
                      {item.relationshipType === 'topic' && 'Related Topic'}
                      {item.relationshipType === 'time' && 'Time Pattern'}
                      {item.relationshipType === 'semantic' && 'Similar Idea'}
                    </Text>
                    <Text style={[styles.connectedTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.connectedSnippet, { color: colors.textMuted }]} numberOfLines={2}>
                      {item.connectionReason}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noConnectedText, { color: colors.textMuted }]}>
                No connected moments yet. As you capture more memories, meaningful connections will appear here.
              </Text>
            )}
          </View>
        </ScrollView>

        {/* 3-Dots Action Sheet Modal */}
        <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={[styles.menuSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.menuHeader}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Options</Text>
                <TouchableOpacity onPress={() => setShowMenu(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {isOwner ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={startEditing}
                  activeOpacity={0.7}
                >
                  <Edit3 size={18} color={colors.accent} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Memory</Text>
                </TouchableOpacity>
              ) : null}

              {onInvitePeople ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false)
                    onInvitePeople(memory)
                  }}
                  activeOpacity={0.7}
                >
                  <UserPlus size={18} color={colors.accent} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Share / Invite Friends</Text>
                </TouchableOpacity>
              ) : null}

              {onAddPerspective ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false)
                    onAddPerspective(memory)
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={colors.accent} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Add Perspective</Text>
                </TouchableOpacity>
              ) : null}

              {isOwner ? (
                <>
                  <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={confirmDelete}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color={colors.danger} />
                    <Text style={[styles.menuItemText, { color: colors.danger, fontWeight: '600' }]}>Delete Memory</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sharedContextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    marginBottom: 12,
  },
  sharedContextText: {
    fontSize: 12,
    fontWeight: '600',
  },
  singleImageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  singleImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
  gallery: {
    marginBottom: 16,
  },
  galleryImageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  mediaDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 13,
    fontWeight: '600',
  },
  documentMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  audioWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  audioDeleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 12,
  },
  summaryBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 19,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  editContainer: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  editInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  editTextarea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  editActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelEditBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelEditBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmSaveBtnText: {
    color: '#211d1a',
    fontSize: 13,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  participantsBar: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  participantsTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  participantsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
  },
  pAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pAvatarText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  pName: {
    fontSize: 12,
    fontWeight: '500',
  },
  pStatus: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  perspectivesSection: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  perspectivesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  perspectivesTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  perspectivesSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  collabIconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perspectiveCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  perspectiveCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  perspectiveAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perspectiveAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perspectiveAuthorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  perspectivePlace: {
    fontSize: 10,
  },
  perspectiveDeleteBtn: {
    padding: 2,
  },
  perspectiveSingleImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 6,
  },
  perspectiveGallery: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  perspectiveGalleryThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 6,
  },
  perspectiveText: {
    fontSize: 12,
    lineHeight: 17,
  },
  perspectiveTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  perspectiveTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  perspectiveTagText: {
    fontSize: 10,
  },
  connectedSection: {
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  connectedHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  connectedLeft: {
    flex: 1,
    marginRight: 10,
  },
  connectedReason: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  connectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  connectedSnippet: {
    fontSize: 11,
    lineHeight: 15,
  },
  noConnectedText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
})
