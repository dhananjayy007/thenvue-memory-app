import React, { useState, useEffect, useCallback } from 'react'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Clock, Plus, User } from 'lucide-react-native'
import { CustomBrainIcon } from './src/components/CustomBrainIcon'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

import { supabase } from './src/lib/supabase'
import { darkColors, lightColors } from './src/theme/colors'
import type { Memory, MemoryPerspective } from './src/types/memory'
import {
  fetchMemories,
  createMemory,
  createVoiceMemory,
  deleteMemory,
  addPhotoToMemory,
  fetchNotifications,
  fetchMemoryDetails,
  deletePerspective,
} from './src/lib/memories'

import { Header } from './src/components/Header'
import { AuthScreen } from './src/screens/AuthScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { TimelineScreen } from './src/screens/TimelineScreen'
import { AskScreen } from './src/screens/AskScreen'
import { PeopleScreen } from './src/screens/PeopleScreen'
import { PlacesScreen } from './src/screens/PlacesScreen'
import { YouScreen } from './src/screens/YouScreen'

import { CaptureModal } from './src/components/CaptureModal'
import { MemoryDetailModal } from './src/components/MemoryDetailModal'
import { PhotoActionSheetModal, type SelectedPhoto } from './src/components/PhotoActionSheetModal'
import { ToastFeedback } from './src/components/ToastFeedback'
import { OnboardingScreen } from './src/screens/OnboardingScreen'
import { fetchOnboardingStatus, markOnboardingComplete, resetOnboardingForTesting } from './src/lib/onboarding'

import { InvitePeopleModal } from './src/components/InvitePeopleModal'
import { PerspectiveComposerModal } from './src/components/PerspectiveComposerModal'
import { NotificationModal } from './src/components/NotificationModal'
import { RediscoverModal } from './src/components/RediscoverModal'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  const [dark, setDark] = useState(true)
  const colors = dark ? darkColors : lightColors

  const [currentTab, setCurrentTab] = useState<'home' | 'timeline' | 'ask' | 'people' | 'places' | 'you'>('home')
  const [memories, setMemories] = useState<Memory[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Modals
  const [captureVisible, setCaptureVisible] = useState(false)
  const [captureMode, setCaptureMode] = useState<'text' | 'voice'>('text')
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)

  const [customDisplayName, setCustomDisplayName] = useState<string>('')
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)

  // Shared Memories & Notifications Modals State
  const [inviteMemory, setInviteMemory] = useState<Memory | null>(null)
  const [perspectiveMemory, setPerspectiveMemory] = useState<Memory | null>(null)
  const [notificationModalVisible, setNotificationModalVisible] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)

  // Rediscover Past Photos Modal State
  const [rediscoverVisible, setRediscoverVisible] = useState(false)

  // Photo Attachment Modal & Feedback
  const [photoActionSheetVisible, setPhotoActionSheetVisible] = useState(false)
  const [targetMemoryForPhoto, setTargetMemoryForPhoto] = useState<Memory | null>(null)
  const [uploadingMemoryId, setUploadingMemoryId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const handleInitiateAddPhoto = (memory: Memory) => {
    if (uploadingMemoryId) return // Prevent duplicate concurrent uploads
    setTargetMemoryForPhoto(memory)
    setPhotoActionSheetVisible(true)
  }

  const handlePhotoSelected = async (photo: SelectedPhoto) => {
    if (!targetMemoryForPhoto) return
    const target = targetMemoryForPhoto
    setPhotoActionSheetVisible(false)
    setUploadingMemoryId(target.id)

    try {
      const newMediaAsset = await addPhotoToMemory(target.id, target.date, photo)

      // Update memories list immediately
      setMemories((prev) =>
        prev.map((m) =>
          m.id === target.id
            ? { ...m, media: [...m.media, newMediaAsset] }
            : m
        )
      )

      // Update currently open detail modal if open
      if (selectedMemory?.id === target.id) {
        setSelectedMemory((prev) =>
          prev ? { ...prev, media: [...prev.media, newMediaAsset] } : null
        )
      }

      setToastMessage('Photo added to this memory')
      setToastVisible(true)
    } catch (err: any) {
      console.error('Failed to add photo:', err)
      const errorMsg = err?.message || 'Could not attach photo to memory.'
      Alert.alert(
        'Unable to Add Photo',
        errorMsg,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: () => {
              setTargetMemoryForPhoto(target)
              handlePhotoSelected(photo)
            },
          },
        ]
      )
    } finally {
      setUploadingMemoryId(null)
      setTargetMemoryForPhoto(null)
    }
  }

  // Load Notifications Count
  const loadNotificationCount = useCallback(async () => {
    if (!session) return
    try {
      const notifs = await fetchNotifications()
      const unread = notifs.filter((n) => n.status === 'unread').length
      setUnreadNotificationsCount(unread)
    } catch {}
  }, [session])

  // Auth Listener & Onboarding Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.user_metadata?.display_name) {
        setCustomDisplayName(session.user.user_metadata.display_name)
      }
      if (session?.user) {
        fetchOnboardingStatus(session.user.id, memories.length > 0).then((completed) => {
          setHasCompletedOnboarding(completed)
          setLoadingAuth(false)
        }).catch(() => {
          setHasCompletedOnboarding(true)
          setLoadingAuth(false)
        })
        loadNotificationCount()
      } else {
        setHasCompletedOnboarding(null)
        setLoadingAuth(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.user_metadata?.display_name) {
        setCustomDisplayName(session.user.user_metadata.display_name)
      }
      if (session?.user) {
        fetchOnboardingStatus(session.user.id, memories.length > 0).then((completed) => {
          setHasCompletedOnboarding(completed)
          setLoadingAuth(false)
        }).catch(() => {
          setHasCompletedOnboarding(true)
          setLoadingAuth(false)
        })
        loadNotificationCount()
      } else {
        setHasCompletedOnboarding(null)
        setLoadingAuth(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [memories.length, loadNotificationCount])

  // Load Memories
  const loadMemories = useCallback(async () => {
    if (!session) return
    try {
      const data = await fetchMemories()
      setMemories(data)
      loadNotificationCount()
    } catch (err) {
      console.error('Failed to load memories:', err)
    }
  }, [session, loadNotificationCount])

  useEffect(() => {
    if (session) {
      loadMemories()
    } else {
      setMemories([])
    }
  }, [session, loadMemories])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadMemories()
    setRefreshing(false)
  }

  const handleOnboardingComplete = async (startCapturing: boolean) => {
    if (user) {
      markOnboardingComplete(user.id).catch(() => {})
    }
    setHasCompletedOnboarding(true)
    if (startCapturing) {
      setCaptureMode('text')
      setCaptureVisible(true)
    }
  }

  const handleResetOnboarding = async () => {
    if (user) {
      await resetOnboardingForTesting(user.id)
    }
    setHasCompletedOnboarding(false)
  }

  const handleSaveText = async (
    draft: string,
    photos: { base64: string; fileName: string; fileSize: number }[]
  ) => {
    const created = await createMemory(draft, photos)
    setMemories((prev) => [created, ...prev])
    setToastMessage('Memory saved')
    setToastVisible(true)
  }

  const handleSaveVoice = async (audioBase64: string, fileName: string, fileSize: number) => {
    const created = await createVoiceMemory(audioBase64, fileName, fileSize)
    setMemories((prev) => [created, ...prev])
    setToastMessage('Voice memory saved')
    setToastVisible(true)
  }

  const handleDeleteMemory = async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id))
    if (selectedMemory?.id === id) setSelectedMemory(null)
    await deleteMemory(id)
    setToastMessage('Memory deleted')
    setToastVisible(true)
  }

  const handleSelectMemoryDetail = async (m: Memory) => {
    setSelectedMemory(m)
    // Fetch full detail with participants & perspectives
    try {
      const full = await fetchMemoryDetails(m.id)
      if (full) setSelectedMemory(full)
    } catch {}
  }

  const handleInvitePeople = (mem: Memory) => {
    setInviteMemory(mem)
  }

  const handleAddPerspective = (mem: Memory) => {
    setPerspectiveMemory(mem)
  }

  const handleOpenPerspectiveComposer = async (memoryId: string) => {
    let target = memories.find((m) => m.id === memoryId)
    if (!target) {
      const full = await fetchMemoryDetails(memoryId)
      if (full) target = full
    }
    if (target) {
      setPerspectiveMemory(target)
    } else {
      Alert.alert('Memory not found', 'Could not open that shared memory.')
    }
  }

  const handleOpenMemoryFromNotification = async (memoryId: string) => {
    let target = memories.find((m) => m.id === memoryId)
    if (!target) {
      const full = await fetchMemoryDetails(memoryId)
      if (full) target = full
    }
    if (target) {
      setSelectedMemory(target)
    } else {
      Alert.alert('Memory not found', 'Could not find that shared memory.')
    }
  }

  const handleDeletePerspective = async (perspectiveId: string) => {
    await deletePerspective(perspectiveId)
    if (selectedMemory) {
      const updated = await fetchMemoryDetails(selectedMemory.id)
      if (updated) setSelectedMemory(updated)
    }
    setToastMessage('Perspective removed')
    setToastVisible(true)
  }

  const handlePerspectiveSaved = async (perspective: MemoryPerspective, savedToPersonal: boolean) => {
    if (savedToPersonal) {
      await loadMemories()
      setToastMessage('Saved to your memories & shared memory')
    } else {
      setToastMessage('Added to the shared memory')
    }
    setToastVisible(true)

    if (selectedMemory?.id === perspective.memoryId) {
      const updated = await fetchMemoryDetails(selectedMemory.id)
      if (updated) setSelectedMemory(updated)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setHasCompletedOnboarding(null)
  }

  if (loadingAuth || (session && hasCompletedOnboarding === null)) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
        <AuthScreen colors={colors} />
      </SafeAreaProvider>
    )
  }

  if (hasCompletedOnboarding === false) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
        <OnboardingScreen colors={colors} onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    )
  }

  const userInitial = (customDisplayName || user?.user_metadata?.display_name || user?.email?.charAt(0) || 'N').charAt(0).toUpperCase()

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />

        {/* Top Header */}
        <Header
          colors={colors}
          dark={dark}
          onToggleTheme={() => setDark(!dark)}
          onOpenSearch={() => setCurrentTab('timeline')}
          onOpenCapture={() => {
            setCaptureMode('text')
            setCaptureVisible(true)
          }}
          onOpenNotifications={() => setNotificationModalVisible(true)}
          onOpenRediscover={() => setRediscoverVisible(true)}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* Current View */}
        <View style={styles.viewContainer}>
          {currentTab === 'home' && (
            <HomeScreen
              memories={memories}
              colors={colors}
              displayName={customDisplayName || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Friend'}
              refreshing={refreshing}
              uploadingMemoryId={uploadingMemoryId}
              currentUserId={user?.id}
              onRefresh={onRefresh}
              onSelectMemory={handleSelectMemoryDetail}
              onOpenCapture={() => {
                setCaptureMode('text')
                setCaptureVisible(true)
              }}
              onOpenVoice={() => {
                setCaptureMode('voice')
                setCaptureVisible(true)
              }}
              onNavigateTimeline={() => setCurrentTab('timeline')}
              onAddPhoto={handleInitiateAddPhoto}
            />
          )}

          {currentTab === 'timeline' && (
            <TimelineScreen
              memories={memories}
              colors={colors}
              onSelectMemory={handleSelectMemoryDetail}
            />
          )}

          {currentTab === 'ask' && (
            <AskScreen
              memories={memories}
              colors={colors}
              onSelectMemory={handleSelectMemoryDetail}
            />
          )}

          {currentTab === 'people' && (
            <PeopleScreen
              memories={memories}
              colors={colors}
              onSelectPerson={() => setCurrentTab('timeline')}
            />
          )}

          {currentTab === 'places' && (
            <PlacesScreen
              memories={memories}
              colors={colors}
              onSelectPlace={() => setCurrentTab('timeline')}
            />
          )}

          {currentTab === 'you' && (
            <YouScreen
              memories={memories}
              colors={colors}
              dark={dark}
              userEmail={user?.email || 'User'}
              currentDisplayName={customDisplayName || user?.user_metadata?.display_name || user?.email?.split('@')[0]}
              onToggleTheme={() => setDark(!dark)}
              onSignOut={handleSignOut}
              onNavigatePeople={() => setCurrentTab('people')}
              onNavigatePlaces={() => setCurrentTab('places')}
              onNavigateAsk={() => setCurrentTab('ask')}
              onDisplayNameUpdated={(newName) => setCustomDisplayName(newName)}
              onReplayTutorial={handleResetOnboarding}
            />
          )}
        </View>

        {/* Bottom Floating Navigation Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.navBg, borderTopColor: colors.border }]}>
          {/* Home / Avatar Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('home')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.navAvatar,
                {
                  backgroundColor: currentTab === 'home' ? '#000000' : 'transparent',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.navAvatarText,
                  { color: currentTab === 'home' ? '#FFFFFF' : colors.tabInactive },
                ]}
              >
                {userInitial}
              </Text>
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: currentTab === 'home' ? colors.tabActive : colors.tabInactive },
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          {/* Timeline Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('timeline')}
            activeOpacity={0.7}
          >
            <Clock size={20} color={currentTab === 'timeline' ? colors.tabActive : colors.tabInactive} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentTab === 'timeline' ? colors.tabActive : colors.tabInactive },
              ]}
            >
              Timeline
            </Text>
          </TouchableOpacity>

          {/* Center Floating Plus Capture Button */}
          <TouchableOpacity
            style={[styles.captureBtn, { backgroundColor: colors.accent }]}
            onPress={() => {
              setCaptureMode('text')
              setCaptureVisible(true)
            }}
            activeOpacity={0.85}
          >
            <Plus size={24} color="#211d1a" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Ask Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('ask')}
            activeOpacity={0.7}
          >
            <CustomBrainIcon size={20} color={currentTab === 'ask' ? colors.tabActive : colors.tabInactive} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentTab === 'ask' ? colors.tabActive : colors.tabInactive },
              ]}
            >
              Ask
            </Text>
          </TouchableOpacity>

          {/* You Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('you')}
            activeOpacity={0.7}
          >
            <User size={20} color={currentTab === 'you' ? colors.tabActive : colors.tabInactive} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentTab === 'you' ? colors.tabActive : colors.tabInactive },
              ]}
            >
              You
            </Text>
          </TouchableOpacity>
        </View>

        {/* Capture Modal */}
        <CaptureModal
          visible={captureVisible}
          initialMode={captureMode}
          colors={colors}
          onClose={() => setCaptureVisible(false)}
          onSaveText={handleSaveText}
          onSaveVoice={handleSaveVoice}
        />

        {/* Memory Detail Modal */}
        <MemoryDetailModal
          memory={selectedMemory}
          allMemories={memories}
          colors={colors}
          visible={Boolean(selectedMemory)}
          onClose={() => setSelectedMemory(null)}
          onDelete={handleDeleteMemory}
          onSelectConnected={handleSelectMemoryDetail}
          onInvitePeople={handleInvitePeople}
          onAddPerspective={handleAddPerspective}
          onDeletePerspective={handleDeletePerspective}
        />

        {/* Invite People Modal */}
        {inviteMemory && (
          <InvitePeopleModal
            memory={inviteMemory}
            visible={Boolean(inviteMemory)}
            colors={colors}
            onClose={() => setInviteMemory(null)}
            onInvited={() => {
              if (selectedMemory?.id === inviteMemory.id) {
                fetchMemoryDetails(selectedMemory.id).then((full) => {
                  if (full) setSelectedMemory(full)
                })
              }
            }}
          />
        )}

        {/* Perspective Composer Modal */}
        {perspectiveMemory && (
          <PerspectiveComposerModal
            memory={perspectiveMemory}
            visible={Boolean(perspectiveMemory)}
            colors={colors}
            onClose={() => setPerspectiveMemory(null)}
            onSaved={handlePerspectiveSaved}
          />
        )}

        {/* Notifications Modal */}
        <NotificationModal
          visible={notificationModalVisible}
          colors={colors}
          onClose={() => setNotificationModalVisible(false)}
          onOpenPerspectiveComposer={handleOpenPerspectiveComposer}
          onOpenMemory={handleOpenMemoryFromNotification}
          onUnreadCountChange={(count) => setUnreadNotificationsCount(count)}
        />

        {/* Photo Action Sheet Modal */}
        <PhotoActionSheetModal
          visible={photoActionSheetVisible}
          colors={colors}
          onClose={() => {
            setPhotoActionSheetVisible(false)
            setTargetMemoryForPhoto(null)
          }}
          onPhotoSelected={handlePhotoSelected}
        />

        {/* Rediscover Past Photos Modal */}
        <RediscoverModal
          isOpen={rediscoverVisible}
          onClose={() => setRediscoverVisible(false)}
          onMemoryCreated={(newMemory) => {
            setMemories((prev) => [newMemory, ...prev])
            setToastMessage('Rediscovered memory created!')
            setToastVisible(true)
          }}
        />

        {/* Toast Feedback Notification */}
        <ToastFeedback
          visible={toastVisible}
          message={toastMessage}
          colors={colors}
          onDismiss={() => setToastVisible(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAvatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 4,
  },
  captureBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#d88a6a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
})
