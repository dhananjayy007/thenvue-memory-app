'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Memory, MemoryCaptureTime, NewMediaInput, MediaAsset, MemoryPerspective } from '@/types/memory'
import { nav } from '@/lib/seed-data'
import { signOut } from '@/app/login/actions'
import {
  createMemory,
  enrichMemoryAction,
  createVoiceMemoryAction,
  processVoiceMemoryAction,
  deleteMedia,
  deleteMemory,
  getMemories,
  getMemoryDetailsAction,
  searchMemoriesAction,
  getOnboardingStatusAction,
  completeOnboardingAction,
  resetOnboardingAction,
} from '@/app/memories/actions'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Home } from '@/components/views/home'
import { Timeline } from '@/components/views/timeline'
import { Memories } from '@/components/views/memories'
import { Ask } from '@/components/views/ask'
import { People } from '@/components/views/people'
import { Places } from '@/components/views/places'
import { You } from '@/components/views/you'
import { Rediscover } from '@/components/views/rediscover'
import { RediscoverImportModal } from '@/components/rediscover/rediscover-import-modal'
import { Capture } from '@/components/memory/capture-modal'
import { Detail } from '@/components/memory/detail-modal'
import { OnboardingModal } from '@/components/auth/onboarding-modal'
import { PhotoUploadModal } from '@/components/memory/photo-upload-modal'
import { InvitePeopleModal } from '@/components/memory/invite-people-modal'
import { PerspectiveComposerModal } from '@/components/memory/perspective-composer-modal'
import { NotificationCenter } from '@/components/notifications/notification-center'

export function AppShell({
  displayName,
  memberSince,
  initialMemories,
}: {
  displayName: string
  memberSince: string
  initialMemories: Memory[]
}) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories)
  const [view, setView] = useState('home')
  const [dark, setDark] = useState(true)
  const [capture, setCapture] = useState(false)
  const [captureMode, setCaptureMode] = useState<'text' | 'voice'>('text')
  const [detail, setDetail] = useState<Memory | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [ask, setAsk] = useState('')
  const [answer, setAnswer] = useState(false)
  const [semanticResults, setSemanticResults] = useState<Memory[] | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Shared Memories & Notifications Modals State
  const [inviteMemory, setInviteMemory] = useState<Memory | null>(null)
  const [perspectiveMemory, setPerspectiveMemory] = useState<Memory | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)

  // Rediscover Past Photos Modals State
  const [showRediscoverImport, setShowRediscoverImport] = useState(false)
  const [rediscoverRefreshTrigger, setRediscoverRefreshTrigger] = useState(0)

  // Onboarding & Photo Attachment Modals State
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [photoUploadMemory, setPhotoUploadMemory] = useState<Memory | null>(null)
  const [searchFocusTrigger, setSearchFocusTrigger] = useState(0)

  const handleSearchClick = () => {
    setView('memories')
    setSearchFocusTrigger((prev) => prev + 1)
  }


  // Hydrate & Persist Theme
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('memory_theme')
      if (savedTheme === 'light') {
        setDark(false)
      } else if (savedTheme === 'dark') {
        setDark(true)
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, [])

  // Check Onboarding status on load
  useEffect(() => {
    getOnboardingStatusAction()
      .then((completed) => {
        if (!completed) {
          setShowOnboarding(true)
        }
      })
      .catch(() => {
        // Fallback: don't block user if check fails
      })
  }, [])

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev
      try {
        localStorage.setItem('memory_theme', next ? 'dark' : 'light')
      } catch {
        // Ignore localStorage write errors
      }
      return next
    })
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => {
      setToast((cur) => (cur === message ? null : cur))
    }, 3000)
  }

  const handleOnboardingComplete = async (startCapturing: boolean) => {
    setShowOnboarding(false)
    completeOnboardingAction().catch(() => {})
    if (startCapturing) {
      openCapture('text')
    }
  }

  const handleReplayTutorial = async () => {
    setShowOnboarding(true)
    resetOnboardingAction().catch(() => {})
  }

  const handleInitiateAddPhoto = (memory: Memory) => {
    setPhotoUploadMemory(memory)
  }

  const handlePhotoAttached = (memoryId: string, newMedia: MediaAsset) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === memoryId ? { ...m, media: [...m.media, newMedia] } : m
      )
    )
    if (detail?.id === memoryId) {
      setDetail((prev) =>
        prev ? { ...prev, media: [...prev.media, newMedia] } : null
      )
    }
    showToast('Photo added to this memory')
  }

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSemanticResults(null)
      return
    }

    let active = true
    const timeout = setTimeout(async () => {
      try {
        const results = await searchMemoriesAction(trimmed, 20)
        if (active) {
          setSemanticResults(results)
        }
      } catch {
        if (active) setSemanticResults(null)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [query])

  const filtered = useMemo(() => {
    if (!query.trim()) return memories

    if (semanticResults && semanticResults.length > 0) {
      const semanticIds = new Set(semanticResults.map((m) => m.id))
      const keywordMatches = memories.filter(
        (m) =>
          !semanticIds.has(m.id) &&
          `${m.text} ${m.place} ${m.topics.join(' ')} ${m.people.join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase())
      )
      return [...semanticResults, ...keywordMatches]
    }

    return memories.filter((m) =>
      `${m.text} ${m.place} ${m.topics.join(' ')} ${m.people.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  }, [memories, query, semanticResults])

  const openCapture = (mode: 'text' | 'voice' = 'text') => {
    setCaptureMode(mode)
    setCapture(true)
    setDraft('')
  }

  const save = async (media: NewMediaInput[] = [], capturedAt: MemoryCaptureTime, place?: string) => {
    const textToSave = draft.trim()
    if (!textToSave) throw new Error('Write something before saving this memory.')
    if (saving) return
    setSaving(true)
    try {
      const created = await createMemory(textToSave, media, capturedAt, place)
      setMemories((prev) => [created, ...prev])
      setCapture(false)
      showToast('Memory saved')

      // Asynchronously trigger AI enrichment in background
      enrichMemoryAction(created.id, place)
        .then((enriched) => {
          if (enriched) {
            setMemories((prev) => prev.map((m) => (m.id === enriched.id ? enriched : m)))
          }
        })
        .catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const saveVoice = async ({
    audioBase64,
    mimeType,
    fileName,
    fileSize,
    capturedAt,
  }: {
    audioBase64: string
    mimeType?: string
    fileName?: string
    fileSize?: number
    capturedAt?: MemoryCaptureTime
  }) => {
    if (saving) return
    setSaving(true)
    try {
      const created = await createVoiceMemoryAction({
        audioBase64,
        mimeType,
        fileName,
        fileSize,
        capturedAt,
      })
      setMemories((prev) => [created, ...prev])
      setCapture(false)
      showToast('Voice memory saved')

      // Asynchronously trigger Gemini transcription & enrichment in background
      processVoiceMemoryAction({
        memoryId: created.id,
        audioBase64,
        mimeType,
      })
        .then((processed) => {
          if (processed) {
            setMemories((prev) => prev.map((m) => (m.id === processed.id ? processed : m)))
          }
        })
        .catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const removeMemory = async (id: string) => {
    const previous = memories
    setMemories((cur) => cur.filter((m) => m.id !== id))
    setDetail(null)
    try {
      await deleteMemory(id)
      showToast('Memory deleted')
    } catch {
      setMemories(previous)
      showToast('Could not delete memory')
    }
  }

  const removeMedia = async (memoryId: string, mediaId: string) => {
    const previous = memories
    setMemories((cur) =>
      cur.map((memory) => {
        if (memory.id !== memoryId) return memory
        return {
          ...memory,
          media: memory.media.filter((media) => media.id !== mediaId),
        }
      })
    )
    setDetail((cur) => {
      if (!cur || cur.id !== memoryId) return cur
      return {
        ...cur,
        media: cur.media.filter((media) => media.id !== mediaId),
      }
    })
    try {
      await deleteMedia(memoryId, mediaId)
      showToast('Attachment removed')
    } catch {
      setMemories(previous)
      setDetail(previous.find((memory) => memory.id === memoryId) ?? null)
      showToast('Could not remove attachment')
    }
  }

  const go = (id: string) => {
    setView(id)
    setQuery('')
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
      const full = await getMemoryDetailsAction(memoryId)
      if (full) target = full
    }
    if (target) {
      setPerspectiveMemory(target)
    } else {
      showToast('Could not find that shared memory.')
    }
  }

  const handleOpenMemoryFromNotification = async (memoryId: string) => {
    let target = memories.find((m) => m.id === memoryId)
    if (!target) {
      const full = await getMemoryDetailsAction(memoryId)
      if (full) target = full
    }
    if (target) {
      setDetail(target)
    } else {
      showToast('Memory not found.')
    }
  }

  const handlePerspectiveSaved = async (
    perspective: MemoryPerspective,
    savedToPersonal: boolean
  ) => {
    // If saved to personal memories, refresh memories list
    if (savedToPersonal) {
      getMemories()
        .then((fresh) => setMemories(fresh))
        .catch(console.error)
      showToast('Saved to your memories & shared memory')
    } else {
      showToast('Added to the shared memory')
    }

    // Refresh detail modal if open
    const currentDetailId = detail?.id
    if (currentDetailId && currentDetailId === perspective.memoryId) {
      getMemoryDetailsAction(currentDetailId)
        .then((full) => {
          if (full) setDetail(full)
        })
        .catch(console.error)
    }
  }

  return (
    <div className={dark ? 'memory-app dark' : 'memory-app'}>
      <Sidebar
        nav={nav}
        view={view}
        onGo={go}
        onCapture={() => openCapture('text')}
        dark={dark}
        onToggleTheme={toggleTheme}
        displayName={displayName}
        onSignOut={signOut}
        onOpenNotifications={() => setShowNotifications(true)}
        unreadCount={unreadNotificationsCount}
      />

      <main className="main-content">
        <Topbar
          onSearch={handleSearchClick}
          onOpenTutorial={() => setShowOnboarding(true)}
          onOpenNotifications={() => setShowNotifications(true)}
          unreadCount={unreadNotificationsCount}
        />

        {view === 'home' && (
          <Home
            memories={memories}
            onCapture={() => openCapture('text')}
            onCaptureVoice={() => openCapture('voice')}
            onOpen={setDetail}
            onGo={go}
            onAddPhoto={handleInitiateAddPhoto}
            displayName={displayName}
          />
        )}
        {view === 'timeline' && (
          <Timeline memories={filtered} onOpen={setDetail} query={query} setQuery={setQuery} onCapture={() => openCapture('text')} />
        )}
        {view === 'memories' && (
          <Memories
            memories={filtered}
            onOpen={setDetail}
            query={query}
            setQuery={setQuery}
            onCapture={() => openCapture('text')}
            focusTrigger={searchFocusTrigger}
          />
        )}

        {view === 'rediscover' && (
          <Rediscover
            onOpen={setDetail}
            onStartImport={() => setShowRediscoverImport(true)}
            quotaRefreshTrigger={rediscoverRefreshTrigger}
          />
        )}

        {view === 'ask' && <Ask memories={memories} ask={ask} setAsk={setAsk} answer={answer} setAnswer={setAnswer} onOpen={setDetail} />}
        {view === 'people' && <People memories={memories} onOpen={setDetail} onCapture={() => openCapture('text')} />}
        {view === 'places' && <Places memories={memories} onOpen={setDetail} onCapture={() => openCapture('text')} />}
        {view === 'you' && (
          <You
            memories={memories}
            onGo={go}
            onTheme={toggleTheme}
            dark={dark}
            displayName={displayName}
            memberSince={memberSince}
            onSignOut={signOut}
            onReplayTutorial={handleReplayTutorial}
          />
        )}
      </main>

      <MobileNav view={view} onGo={go} onCapture={() => openCapture('text')} />

      {capture && (
        <Capture
          draft={draft}
          setDraft={setDraft}
          onClose={() => setCapture(false)}
          onSave={save}
          onSaveVoice={saveVoice}
          saving={saving}
          initialMode={captureMode}
        />
      )}
      {detail && (
        <Detail
          memory={detail}
          memories={memories}
          onClose={() => setDetail(null)}
          onDelete={() => removeMemory(detail.id)}
          onOpen={setDetail}
          onDeleteMedia={(mediaId) => removeMedia(detail.id, mediaId)}
          onInvitePeople={handleInvitePeople}
          onAddPerspective={handleAddPerspective}
          onAddPhoto={(mem) => setPhotoUploadMemory(mem)}
          onUpdateMemory={(updated) => {
            setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
            setDetail(updated)
            showToast('Memory updated')
          }}
        />
      )}

      {/* Invite People Modal */}
      {inviteMemory && (
        <InvitePeopleModal
          memory={inviteMemory}
          isOpen={Boolean(inviteMemory)}
          onClose={() => setInviteMemory(null)}
          onInvited={() => {
            if (detail?.id === inviteMemory.id) {
              getMemoryDetailsAction(detail.id).then((full) => {
                if (full) setDetail(full)
              })
            }
          }}
        />
      )}

      {/* Perspective Composer Modal */}
      {perspectiveMemory && (
        <PerspectiveComposerModal
          memory={perspectiveMemory}
          isOpen={Boolean(perspectiveMemory)}
          onClose={() => setPerspectiveMemory(null)}
          onSaved={handlePerspectiveSaved}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onOpenPerspectiveComposer={handleOpenPerspectiveComposer}
        onOpenMemory={handleOpenMemoryFromNotification}
        onUnreadCountChange={(count) => setUnreadNotificationsCount(count)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Rediscover Past Photo Import Modal */}
      <RediscoverImportModal
        isOpen={showRediscoverImport}
        onClose={() => setShowRediscoverImport(false)}
        onMemoryCreated={(newMemory) => {
          setMemories((prev) => [newMemory, ...prev])
          setRediscoverRefreshTrigger((prev) => prev + 1)
          showToast('Rediscovered memory created & added to your timeline')
        }}
      />

      {toast && (
        <div className="toast-container">
          <div className="toast-pill">{toast}</div>
        </div>
      )}
    </div>
  )
}
