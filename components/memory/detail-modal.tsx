'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CircleUserRound,
  MapPin,
  MoreHorizontal,
  Trash2,
  ChevronRight,
  Play,
  Pause,
  UserPlus,
  Users,
  Plus,
  Sparkles,
  Share2,
} from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'
import type { Memory, MemoryPerspective } from '@/types/memory'
import {
  deletePerspectiveAction,
  getConnectedMemoriesAction,
  getMemoryDetailsAction,
} from '@/app/memories/actions'
import type { ConnectedMemory } from '@/lib/ai/connected-memories'
import { fmt } from '@/lib/format'

export function Detail({
  memory: initialMemory,
  memories: _memories,
  onClose,
  onDelete,
  onOpen,
  onDeleteMedia,
  onInvitePeople,
  onAddPerspective,
}: {
  memory: Memory
  memories: Memory[]
  onClose: () => void
  onDelete: () => void
  onOpen: (memory: Memory) => void
  onDeleteMedia: (mediaId: string) => void
  onInvitePeople?: (memory: Memory) => void
  onAddPerspective?: (memory: Memory) => void
}) {
  const [memory, setMemory] = useState<Memory>(initialMemory)
  const [connected, setConnected] = useState<ConnectedMemory[] | null>(null)
  const [loadingConnected, setLoadingConnected] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null)
  const [perspectiveToDelete, setPerspectiveToDelete] = useState<string | null>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  // Fetch full details (participants & perspectives with signed URLs)
  useEffect(() => {
    let active = true
    getMemoryDetailsAction(initialMemory.id)
      .then((fullMem) => {
        if (active && fullMem) {
          setMemory(fullMem)
        }
      })
      .catch(console.error)

    return () => {
      active = false
    }
  }, [initialMemory.id])

  useEffect(() => {
    let active = true
    setLoadingConnected(true)
    getConnectedMemoriesAction(memory.id, 3)
      .then((res) => {
        if (active) setConnected(res)
      })
      .catch((err) => {
        console.error('Failed to load connected memories:', err)
        if (active) setConnected([])
      })
      .finally(() => {
        if (active) setLoadingConnected(false)
      })

    return () => {
      active = false
    }
  }, [memory.id])

  const photoMedia = (memory.media || []).filter((m) => m.mediaType === 'image')
  const audioMedia = (memory.media || []).filter((m) => m.mediaType === 'audio')
  const pdfMedia = (memory.media || []).filter(
    (m) => m.mediaType === 'document' || m.fileName?.toLowerCase().endsWith('.pdf')
  )

  const isOwner = memory.isOwner !== false
  const perspectives = memory.perspectives || []
  const participants = memory.participants || []

  const handleDeletePerspective = async (pId: string) => {
    try {
      await deletePerspectiveAction(pId)
      setMemory((prev) => ({
        ...prev,
        perspectives: (prev.perspectives || []).filter((p) => p.id !== pId),
      }))
    } catch (err) {
      console.error('Failed to delete perspective:', err)
    }
  }

  return (
    <>
      <div className="overlay detail-overlay">
        <div className="detail-modal">
          <header>
            <button onClick={onClose} aria-label="Back">
              <ArrowLeft size={19} />
            </button>
            <span>Memory</span>
            <div className="detail-header-actions">
              {isOwner && onInvitePeople && (
                <button
                  type="button"
                  className="detail-header-btn"
                  onClick={() => onInvitePeople(memory)}
                  title="Share with people"
                >
                  <UserPlus size={17} />
                  <span>Share</span>
                </button>
              )}
              {isOwner && (
                <button aria-label="Delete" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={17} />
                </button>
              )}
              <button aria-label="More">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </header>

          <article>
            {/* Shared Origin Badge */}
            {memory.sharedContext && (
              <div className="detail-shared-context-pill">
                <Share2 size={13} />
                <span>{memory.sharedContext}</span>
              </div>
            )}

            {/* Participants Bar */}
            {participants.length > 0 && (
              <div className="detail-participants-bar">
                <div className="participants-title">
                  <Users size={14} />
                  <span>Participants ({participants.length})</span>
                </div>
                <div className="participants-chips">
                  {participants.map((p) => (
                    <span key={p.id} className={`participant-chip status-${p.status}`}>
                      <span className="p-chip-avatar">{p.displayName[0]?.toUpperCase() || '?'}</span>
                      <span className="p-chip-name">{p.displayName}</span>
                      <span className="p-chip-status">{p.status}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Memory Media */}
            {audioMedia.map((audio) => (
              <AudioPlayerItem key={audio.id} media={audio} onDelete={(id) => setMediaToDelete(id)} />
            ))}

            {pdfMedia.map((pdf) => (
              <div key={pdf.id} className="detail-pdf-attachment">
                <div className="capture-pdf-thumb" style={{ width: 44, height: 44, flexShrink: 0 }}>
                  <span className="capture-pdf-ext" style={{ fontSize: 9 }}>
                    PDF
                  </span>
                </div>
                <div className="detail-pdf-info">
                  <strong>{pdf.fileName || 'Document.pdf'}</strong>
                  <small>{(pdf.fileSize / 1024 / 1024).toFixed(2)} MB</small>
                </div>
                <div className="detail-pdf-actions">
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="capture-btn capture-btn-cancel"
                    style={{ padding: '6px 12px' }}
                  >
                    View
                  </a>
                  {isOwner && (
                    <button
                      onClick={() => setMediaToDelete(pdf.id)}
                      aria-label="Delete PDF"
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: 'var(--muted-foreground)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {photoMedia.length === 1 && (
              <MediaImage
                media={photoMedia[0]}
                className="detail-image"
                onDelete={(id) => setMediaToDelete(id)}
                onExpand={(url) => setExpandedImage(url)}
                canDelete={isOwner}
              />
            )}
            {photoMedia.length > 1 && (
              <div className="detail-gallery">
                {photoMedia.map((media) => (
                  <MediaImage
                    key={media.id}
                    media={media}
                    onDelete={(id) => setMediaToDelete(id)}
                    onExpand={(url) => setExpandedImage(url)}
                    canDelete={isOwner}
                  />
                ))}
              </div>
            )}

            <p className="eyebrow">
              {fmt(memory.date)} · {memory.time}
            </p>
            <h1>{memory.title}</h1>
            {memory.summary && <p className="subhead">{memory.summary}</p>}
            <p className="original-label">
              {audioMedia.length > 0 ? 'Transcription' : 'Original writing'}
            </p>
            <p className="detail-text">{memory.text}</p>

            <div className="metadata">
              {memory.place && (
                <span>
                  <MapPin size={14} /> {memory.place}
                </span>
              )}
              {memory.people.map((p) => (
                <span key={p}>
                  <CircleUserRound size={14} /> {p}
                </span>
              ))}
              {memory.topics.map((topic) => (
                <span key={topic}>
                  <CustomBrainIcon size={14} /> {topic}
                </span>
              ))}
            </div>

            {/* ---------------------------------------------------- */}
            {/* PERSPECTIVES SECTION */}
            {/* ---------------------------------------------------- */}
            <div className="detail-perspectives-section">
              <div className="perspectives-header">
                <div>
                  <h2>Perspectives {perspectives.length > 0 && `(${perspectives.length})`}</h2>
                  <p className="perspectives-sub">One moment. Multiple perspectives.</p>
                </div>
                {onAddPerspective && (
                  <button
                    type="button"
                    className="add-perspective-btn"
                    onClick={() => onAddPerspective(memory)}
                  >
                    <Plus size={15} />
                    <span>Add My Perspective</span>
                  </button>
                )}
              </div>

              {perspectives.length === 0 ? (
                <div className="perspectives-empty-box">
                  <Sparkles size={20} className="perspectives-empty-icon" />
                  <p>No other perspectives added yet.</p>
                  <small>
                    Invite friends who experienced this moment to add their memories, voice notes, and photos.
                  </small>
                  {isOwner && onInvitePeople && (
                    <button
                      type="button"
                      className="invite-perspectives-cta"
                      onClick={() => onInvitePeople(memory)}
                    >
                      <UserPlus size={14} /> Share with people
                    </button>
                  )}
                </div>
              ) : (
                <div className="perspectives-cards-list">
                  {perspectives.map((perspective) => (
                    <PerspectiveCard
                      key={perspective.id}
                      perspective={perspective}
                      onExpandImage={(url) => setExpandedImage(url)}
                      onDeletePerspective={(pId) => setPerspectiveToDelete(pId)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Connected Memories */}
            <div className="connected">
              <h2>Connected memories</h2>
              {loadingConnected ? (
                <p className="answer-note">Finding moments from your life that connect to this one...</p>
              ) : connected && connected.length > 0 ? (
                <>
                  <p className="answer-note" style={{ marginBottom: 12 }}>
                    Moments from your life that connect to this one.
                  </p>
                  {connected.map((m) => (
                    <button key={m.id} onClick={() => onOpen(m)}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          width: 110,
                          flexShrink: 0,
                        }}
                      >
                        <span>{fmt(m.date)}</span>
                        <small style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600 }}>
                          {m.relationshipType === 'people' && 'Shared person'}
                          {m.relationshipType === 'place' && 'Same place'}
                          {m.relationshipType === 'topic' && 'Related topic'}
                          {m.relationshipType === 'time' && 'Time pattern'}
                          {m.relationshipType === 'semantic' && 'Similar idea'}
                        </small>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{m.text}</strong>
                        <small
                          style={{
                            display: 'block',
                            color: 'var(--muted-foreground)',
                            fontSize: 10,
                            marginTop: 3,
                          }}
                        >
                          {m.connectionReason}
                        </small>
                      </div>
                      {m.media.length > 0 && m.media[0].mediaType === 'image' && (
                        <img
                          src={m.media[0].url}
                          alt=""
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 4,
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </>
              ) : (
                <p className="answer-note">
                  No connected moments yet. As you capture more memories, meaningful connections will appear here.
                </p>
              )}
            </div>
          </article>
        </div>
      </div>

      {/* Delete Memory Confirmation */}
      {showDeleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Delete this memory?</h3>
            <p>
              This will permanently remove this memory along with any attached photos and voice
              recordings. This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="voice-action-btn voice-action-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  onDelete()
                }}
              >
                Delete memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Perspective Confirmation */}
      {perspectiveToDelete && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Remove this perspective?</h3>
            <p>This will permanently remove this perspective and its attachments.</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="voice-action-btn voice-action-secondary"
                onClick={() => setPerspectiveToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  const target = perspectiveToDelete
                  setPerspectiveToDelete(null)
                  handleDeletePerspective(target)
                }}
              >
                Remove perspective
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Attachment Confirmation */}
      {mediaToDelete && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Remove this attachment?</h3>
            <p>This will permanently remove this file from your private memory storage.</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="voice-action-btn voice-action-secondary"
                onClick={() => setMediaToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  const target = mediaToDelete
                  setMediaToDelete(null)
                  onDeleteMedia(target)
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setExpandedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={expandedImage}
            alt="Expanded memory photo"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        </div>
      )}
    </>
  )
}

function PerspectiveCard({
  perspective,
  onExpandImage,
  onDeletePerspective,
}: {
  perspective: MemoryPerspective
  onExpandImage: (url: string) => void
  onDeletePerspective: (id: string) => void
}) {
  const photoMedia = perspective.media.filter((m) => m.mediaType === 'image')
  const audioMedia = perspective.media.filter((m) => m.mediaType === 'audio')
  const pdfMedia = perspective.media.filter(
    (m) => m.mediaType === 'document' || m.fileName?.toLowerCase().endsWith('.pdf')
  )

  return (
    <div className="perspective-card">
      <header className="perspective-card-header">
        <div className="perspective-author">
          <span className="perspective-author-avatar">
            {perspective.authorName[0]?.toUpperCase() || '?'}
          </span>
          <div className="perspective-author-info">
            <span className="perspective-author-name">{perspective.authorName}</span>
            {perspective.place && (
              <span className="perspective-author-place">
                <MapPin size={11} /> {perspective.place}
              </span>
            )}
          </div>
        </div>

        {perspective.isAuthor && (
          <button
            type="button"
            className="perspective-card-delete"
            onClick={() => onDeletePerspective(perspective.id)}
            title="Remove perspective"
            aria-label="Remove perspective"
          >
            <Trash2 size={14} />
          </button>
        )}
      </header>

      {/* Audio Players */}
      {audioMedia.map((audio) => (
        <AudioPlayerItem key={audio.id} media={audio} onDelete={() => {}} />
      ))}

      {/* PDFs */}
      {pdfMedia.map((pdf) => (
        <div key={pdf.id} className="detail-pdf-attachment" style={{ margin: '8px 0' }}>
          <div className="capture-pdf-thumb" style={{ width: 36, height: 36, flexShrink: 0 }}>
            <span className="capture-pdf-ext" style={{ fontSize: 8 }}>
              PDF
            </span>
          </div>
          <div className="detail-pdf-info">
            <strong style={{ fontSize: 13 }}>{pdf.fileName || 'Document.pdf'}</strong>
            <small>{(pdf.fileSize / 1024 / 1024).toFixed(2)} MB</small>
          </div>
          <a
            href={pdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="capture-btn capture-btn-cancel"
            style={{ padding: '4px 10px', fontSize: 12 }}
          >
            View
          </a>
        </div>
      ))}

      {/* Photos */}
      {photoMedia.length === 1 && (
        <figure className="detail-media detail-media-single" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="detail-image-expand-btn"
            onClick={() => onExpandImage(photoMedia[0].url)}
          >
            <img className="detail-image" src={photoMedia[0].url} alt="" />
          </button>
        </figure>
      )}
      {photoMedia.length > 1 && (
        <div className="detail-gallery" style={{ marginTop: 8 }}>
          {photoMedia.map((media) => (
            <figure key={media.id} className="detail-media">
              <button
                type="button"
                className="detail-image-expand-btn"
                onClick={() => onExpandImage(media.url)}
              >
                <img src={media.url} alt="" />
              </button>
            </figure>
          ))}
        </div>
      )}

      {/* Story Content */}
      <p className="perspective-card-text">{perspective.text}</p>

      {/* Metadata tags */}
      {((perspective.people && perspective.people.length > 0) ||
        (perspective.topics && perspective.topics.length > 0)) && (
        <div className="perspective-tags">
          {perspective.people.map((p) => (
            <span key={p} className="p-tag">
              <CircleUserRound size={11} /> {p}
            </span>
          ))}
          {perspective.topics.map((t) => (
            <span key={t} className="p-tag">
              <CustomBrainIcon size={11} /> {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AudioPlayerItem({
  media,
  onDelete,
}: {
  media: Memory['media'][number]
  onDelete?: (mediaId: string) => void
}) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(console.error)
    }
  }

  const formatAudioTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '0:00'
    const m = Math.floor(timeInSec / 60)
    const s = Math.floor(timeInSec % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="memory-audio-player">
      <audio
        ref={audioRef}
        src={media.url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrentTime(0)
        }}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
      />
      <button
        type="button"
        className="audio-play-btn"
        onClick={togglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
      </button>
      <div className="audio-scrubber-container">
        <input
          type="range"
          className="audio-scrubber"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            setCurrentTime(val)
            if (audioRef.current) audioRef.current.currentTime = val
          }}
        />
        <div className="audio-time-label">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>
      {onDelete && (
        <button
          type="button"
          className="detail-media-delete"
          style={{ position: 'static', opacity: 0.7 }}
          onClick={() => onDelete(media.id)}
          aria-label={`Delete ${media.fileName}`}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}

function MediaImage({
  media,
  className,
  onDelete,
  onExpand,
  canDelete = true,
}: {
  media: Memory['media'][number]
  className?: string
  onDelete?: (mediaId: string) => void
  onExpand?: (url: string) => void
  canDelete?: boolean
}) {
  return (
    <figure className={className ? 'detail-media detail-media-single' : 'detail-media'}>
      <button
        type="button"
        className="detail-image-expand-btn"
        onClick={() => onExpand?.(media.url)}
        aria-label="View full image"
      >
        <img className={className} src={media.url} alt={media.fileName} />
      </button>
      {canDelete && onDelete && (
        <button
          type="button"
          className="detail-media-delete"
          onClick={() => onDelete(media.id)}
          aria-label={`Delete ${media.fileName}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </figure>
  )
}
