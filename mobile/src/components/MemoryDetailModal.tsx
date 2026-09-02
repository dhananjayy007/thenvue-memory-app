import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native'
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
} from 'lucide-react-native'
import type { Memory, ConnectedMemory, MemoryPerspective } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { formatDate, formatTime } from '../lib/format'
import { AudioPlayer } from './AudioPlayer'
import { getConnectedMemories } from '../lib/memories'

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
}) {
  if (!memory) return null

  const photos = memory.media.filter((m) => m.mediaType === 'image')
  const audio = memory.media.find((m) => m.mediaType === 'audio')
  const connected = getConnectedMemories(memory, allMemories, 3)
  const participants = memory.participants || []
  const perspectives = memory.perspectives || []
  const isOwner = memory.isOwner !== false

  const confirmDelete = () => {
    Alert.alert(
      'Delete memory?',
      'This will permanently delete this memory and any attached photos and voice recordings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDelete(memory.id)
            onClose()
          },
        },
      ]
    )
  }

  const confirmDeletePerspective = (perspectiveId: string) => {
    Alert.alert(
      'Delete perspective?',
      'Are you sure you want to remove this perspective from the shared memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Memory</Text>
          <View style={styles.headerActions}>
            {isOwner && onInvitePeople ? (
              <TouchableOpacity onPress={() => onInvitePeople(memory)} style={styles.headerBtn}>
                <UserPlus size={19} color={colors.accent} />
              </TouchableOpacity>
            ) : null}
            {isOwner ? (
              <TouchableOpacity onPress={confirmDelete} style={styles.headerBtn}>
                <Trash2 size={18} color={colors.danger} />
              </TouchableOpacity>
            ) : null}
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

          {/* Photos */}
          {photos.length === 1 ? (
            <Image source={{ uri: photos[0].url }} style={styles.singleImage} resizeMode="cover" />
          ) : photos.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
              {photos.map((p) => (
                <Image key={p.id} source={{ uri: p.url }} style={styles.galleryImage} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : null}

          {/* Audio player if voice recording */}
          {audio ? <AudioPlayer url={audio.url} colors={colors} /> : null}

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

          {/* Perspectives Section */}
          <View style={[styles.perspectivesSection, { borderTopColor: colors.border }]}>
            <View style={styles.perspectivesHeader}>
              <View>
                <Text style={[styles.perspectivesTitle, { color: colors.text }]}>Perspectives</Text>
                <Text style={[styles.perspectivesSubtitle, { color: colors.textMuted }]}>
                  Different angles on the same moment
                </Text>
              </View>
              {onAddPerspective ? (
                <TouchableOpacity
                  style={[styles.addPerspectiveBtn, { backgroundColor: colors.text }]}
                  onPress={() => onAddPerspective(memory)}
                >
                  <Plus size={14} color={colors.background} />
                  <Text style={[styles.addPerspectiveBtnText, { color: colors.background }]}>Add Side</Text>
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
                        >
                          <Trash2 size={15} color={colors.danger} />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Perspective Photos */}
                    {pPhotos.length === 1 ? (
                      <Image source={{ uri: pPhotos[0].url }} style={styles.perspectiveSingleImage} resizeMode="cover" />
                    ) : pPhotos.length > 1 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                        {pPhotos.map((p) => (
                          <Image key={p.id} source={{ uri: p.url }} style={styles.galleryImage} resizeMode="cover" />
                        ))}
                      </ScrollView>
                    ) : null}

                    {/* Perspective Audio */}
                    {pAudio ? <AudioPlayer url={pAudio.url} colors={colors} /> : null}

                    {/* Perspective Text */}
                    <Text style={[styles.perspectiveText, { color: colors.text }]}>
                      {perspective.text}
                    </Text>

                    {/* Perspective Tags */}
                    {perspective.topics.length > 0 ? (
                      <View style={styles.tagsContainer}>
                        {perspective.topics.map((t) => (
                          <View key={t} style={[styles.tagPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.tagText, { color: colors.textMuted }]}>#{t}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                )
              })
            ) : (
              <View style={[styles.perspectivesEmptyBox, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.emptyBoxTitle, { color: colors.text }]}>No other perspectives yet</Text>
                <Text style={[styles.emptyBoxSubtitle, { color: colors.textMuted }]}>
                  Invite friends who were there to add how they remember this moment.
                </Text>
                {isOwner && onInvitePeople ? (
                  <TouchableOpacity
                    style={[styles.emptyInviteBtn, { borderColor: colors.border }]}
                    onPress={() => onInvitePeople(memory)}
                  >
                    <UserPlus size={14} color={colors.accent} />
                    <Text style={[styles.emptyInviteBtnText, { color: colors.text }]}>Invite People</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
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
  singleImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    marginBottom: 16,
  },
  gallery: {
    marginBottom: 16,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 10,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 28,
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
    fontSize: 14,
    lineHeight: 20,
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
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  perspectivesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  perspectivesTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  perspectivesSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addPerspectiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addPerspectiveBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  perspectiveCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  perspectiveCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  perspectiveAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perspectiveAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perspectiveAuthorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  perspectivePlace: {
    fontSize: 11,
  },
  perspectiveDeleteBtn: {
    padding: 4,
  },
  perspectiveSingleImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  perspectiveText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  perspectivesEmptyBox: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyBoxSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyInviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  emptyInviteBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectedSection: {
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  connectedHeader: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  connectedLeft: {
    flex: 1,
    marginRight: 10,
  },
  connectedReason: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  connectedTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  connectedSnippet: {
    fontSize: 12,
  },
  noConnectedText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
})
