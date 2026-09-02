'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { CalendarDays, Camera, Image as ImageIcon, MapPin, Mic, Users, X, BookmarkCheck, Share2 } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'
import { createClient } from '@/lib/supabase/client'
import { MAX_MEDIA_BYTES, MAX_MEDIA_PER_MEMORY } from '@/lib/memories'
import type { Memory, MemoryPerspective, NewMediaInput } from '@/types/memory'
import { optimizePdf } from '@/lib/pdf-optimizer'
import { addPerspectiveAction } from '@/app/memories/actions'

const MAX_SOURCE_PIXELS = 32_000_000
const MAX_IMAGE_DIMENSION = 2048
const SUPPORTED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

type PendingPhoto = { file: File; preview: string; originalName: string; isPdf?: boolean }

export function PerspectiveComposerModal({
  memory,
  isOpen,
  onClose,
  onSaved,
}: {
  memory: Memory
  isOpen: boolean
  onClose: () => void
  onSaved: (perspective: MemoryPerspective, savedToPersonal: boolean) => void
}) {
  const [draft, setDraft] = useState('')
  const [place, setPlace] = useState('')
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // PDF specific state
  const [showPdfWarning, setShowPdfWarning] = useState(false)
  const [pendingPdfFiles, setPendingPdfFiles] = useState<File[]>([])
  const [dontShowPdfWarning, setDontShowPdfWarning] = useState(false)

  // Confirmation step state ("Save to My Memories?")
  const [showSaveDestinationPrompt, setShowSaveDestinationPrompt] = useState(false)
  const [preparedMedia, setPreparedMedia] = useState<NewMediaInput[]>([])
  const [transcribedDraft, setTranscribedDraft] = useState<string | null>(null)

  const photosRef = useRef<PendingPhoto[]>([])

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    if (isOpen) {
      setDraft('')
      setPlace('')
      setPhotos([])
      setRecordedBlob(null)
      setAudioUrl(null)
      setShowSaveDestinationPrompt(false)
      setError(null)
      setMicError(null)
    }
  }, [isOpen])

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview))
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    },
    [audioUrl]
  )

  if (!isOpen) return null

  const startRecording = async () => {
    setMicError(null)
    setRecordedBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setMicError('Voice recording is not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType })
        setRecordedBlob(fullBlob)
        const url = URL.createObjectURL(fullBlob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordingDuration(0)
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone error:', err)
      setMicError('Microphone access was denied. Please allow microphone access to record voice.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const formatTimer = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (photos.length + files.length > MAX_MEDIA_PER_MEMORY) {
      setError(`You can add up to ${MAX_MEDIA_PER_MEMORY} media items.`)
      return
    }

    setOptimizing(true)

    // Check PDF warning
    const hasPdfs = files.some((f) => f.type === 'application/pdf')
    if (hasPdfs) {
      const skipWarning = localStorage.getItem('skip_pdf_warning') === 'true'
      if (!skipWarning) {
        setPendingPdfFiles(files)
        setShowPdfWarning(true)
        setOptimizing(false)
        return
      }
    }

    await processFiles(files)
  }

  const processFiles = async (filesToProcess: File[]) => {
    setOptimizing(true)
    const prepared: PendingPhoto[] = []
    try {
      for (const file of filesToProcess) {
        if (!SUPPORTED_MEDIA_TYPES.has(file.type)) {
          throw new Error('Choose a JPG, PNG, WebP image, or PDF document.')
        }
        if (file.type === 'application/pdf') {
          const optimized = await optimizePdf(file)
          prepared.push({ ...optimized, isPdf: true })
        } else {
          prepared.push(await optimizeImage(file))
        }
      }
      setError(null)
      setPhotos((previous) => [...previous, ...prepared])
    } catch (err) {
      prepared.forEach((photo) => URL.revokeObjectURL(photo.preview))
      setError(err instanceof Error ? err.message : 'Could not prepare those attachments.')
    } finally {
      setOptimizing(false)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((previous) => {
      URL.revokeObjectURL(previous[index].preview)
      return previous.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  // Prepares media uploads & moves to destination prompt
  const handleProceedToDestinationChoice = async () => {
    setError(null)
    const textContent = draft.trim()

    if (mode === 'text' && !textContent) {
      setError('Write your perspective before continuing.')
      return
    }

    if (mode === 'voice' && !recordedBlob) {
      setError('Record a voice perspective first.')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const mediaItems: NewMediaInput[] = []

      // 1. Upload photos / docs
      for (const photo of photos) {
        const ext = photo.isPdf ? 'pdf' : 'webp'
        const contentType = photo.isPdf ? 'application/pdf' : 'image/webp'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('memory-photos')
          .upload(path, photo.file, { contentType, cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        mediaItems.push({
          storagePath: path,
          mediaType: photo.isPdf ? 'document' : 'image',
          fileName: photo.originalName,
          fileSize: photo.file.size,
        })
      }

      let base64Audio: string | undefined
      // 2. Upload voice recording if present
      if (mode === 'voice' && recordedBlob) {
        const mimeType = recordedBlob.type || 'audio/webm'
        const fileExt = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
        const audioPath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

        const { error: audioUploadErr } = await supabase.storage
          .from('memory-audio')
          .upload(audioPath, recordedBlob, { contentType: mimeType, upsert: false })
        if (audioUploadErr) throw audioUploadErr

        mediaItems.push({
          storagePath: audioPath,
          mediaType: 'audio',
          fileName: `voice_perspective_${new Date().toISOString().slice(0, 10)}.webm`,
          fileSize: recordedBlob.size,
        })

        // Convert blob to base64 for server transcription
        const reader = new FileReader()
        const b64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string
            resolve(res.split(',')[1] || '')
          }
          reader.onerror = reject
        })
        reader.readAsDataURL(recordedBlob)
        base64Audio = await b64Promise
      }

      setPreparedMedia(mediaItems)
      setShowSaveDestinationPrompt(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare perspective attachments.')
    } finally {
      setUploading(false)
    }
  }

  // Finalizes perspective submission with user's destination choice
  const handleFinalSave = async (saveToPersonal: boolean) => {
    setUploading(true)
    setError(null)
    try {
      let base64Audio: string | undefined
      if (mode === 'voice' && recordedBlob) {
        const reader = new FileReader()
        const b64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string
            resolve(res.split(',')[1] || '')
          }
          reader.onerror = reject
        })
        reader.readAsDataURL(recordedBlob)
        base64Audio = await b64Promise
      }

      const finalText = transcribedDraft || draft.trim() || ''
      const perspective = await addPerspectiveAction({
        memoryId: memory.id,
        text: finalText,
        mediaInputs: preparedMedia,
        place: place.trim(),
        saveToPersonalMemory: saveToPersonal,
        audioBase64: base64Audio,
        mimeType: recordedBlob?.type || 'audio/webm',
      })

      onSaved(perspective, saveToPersonal)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add your perspective.')
    } finally {
      setUploading(false)
    }
  }

  const busy = uploading || optimizing

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="capture-modal perspective-modal">
        {/* PDF Compression Warning */}
        {showPdfWarning ? (
          <>
            <div className="capture-header">
              <span>Notice: PDF Compression</span>
              <button
                className="capture-close"
                onClick={() => {
                  setShowPdfWarning(false)
                  setPendingPdfFiles([])
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="capture-pdf-warning">
              <p>
                To save storage space and ensure fast syncing, your document will be compressed.
              </p>
              <label className="capture-pdf-checkbox">
                <input
                  type="checkbox"
                  checked={dontShowPdfWarning}
                  onChange={(e) => setDontShowPdfWarning(e.target.checked)}
                />
                Don't show this message again
              </label>
              <div className="capture-pdf-actions">
                <button
                  type="button"
                  className="capture-btn capture-btn-cancel"
                  onClick={() => {
                    setShowPdfWarning(false)
                    setPendingPdfFiles([])
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="capture-btn capture-btn-save"
                  onClick={() => {
                    if (dontShowPdfWarning) {
                      localStorage.setItem('skip_pdf_warning', 'true')
                    }
                    setShowPdfWarning(false)
                    processFiles(pendingPdfFiles)
                    setPendingPdfFiles([])
                  }}
                >
                  Compress & Attach
                </button>
              </div>
            </div>
          </>
        ) : showSaveDestinationPrompt ? (
          /* "Save this to your memories too?" Confirmation Modal */
          <div className="perspective-destination-container">
            <div className="perspective-destination-header">
              <BookmarkCheck size={28} className="perspective-dest-icon" />
              <h3>Save this to your memories too?</h3>
              <p>Keep your perspective in your personal memories as well, or only add it to this shared memory.</p>
            </div>

            <div className="perspective-dest-options">
              <button
                type="button"
                className="perspective-dest-card recommended"
                onClick={() => handleFinalSave(true)}
                disabled={busy}
              >
                <div className="dest-card-title">
                  <BookmarkCheck size={18} />
                  <strong>Save to My Memories</strong>
                </div>
                <p>
                  Adds your perspective to your personal timeline (with a badge{' '}
                  <em>"From a shared memory"</em>) while also attaching it to this shared memory.
                </p>
              </button>

              <button
                type="button"
                className="perspective-dest-card secondary"
                onClick={() => handleFinalSave(false)}
                disabled={busy}
              >
                <div className="dest-card-title">
                  <Share2 size={18} />
                  <strong>Only Add to Shared Memory</strong>
                </div>
                <p>
                  Your contribution will be visible inside this shared memory only and won't appear on your personal timeline.
                </p>
              </button>
            </div>

            {error && <p className="auth-error" style={{ margin: '12px 0 0' }}>{error}</p>}
            {busy && <p className="capture-hint" style={{ marginTop: 12 }}>Saving your perspective...</p>}
          </div>
        ) : (
          /* Full Perspective Composer */
          <>
            <div className="capture-header">
              <div className="perspective-title-header">
                <span>Add your perspective</span>
                <small>{memory.title}</small>
              </div>
              <button className="capture-close" onClick={onClose} disabled={busy} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {mode === 'voice' ? (
              <div className="voice-box">
                {isRecording ? (
                  <>
                    <div className="voice-status">
                      <span className="pulse-dot" />
                      <span>Recording your perspective...</span>
                    </div>
                    <div className="voice-timer">{formatTimer(recordingDuration)}</div>
                    <div className="voice-controls">
                      <button type="button" className="voice-action-btn" onClick={stopRecording}>
                        Stop recording
                      </button>
                    </div>
                  </>
                ) : recordedBlob && audioUrl ? (
                  <>
                    <div className="voice-status">
                      <span>Voice perspective ready ({formatTimer(recordingDuration)})</span>
                    </div>
                    <audio
                      ref={audioElementRef}
                      src={audioUrl}
                      controls
                      style={{ width: '100%', maxWidth: 360 }}
                    />
                    <div className="voice-controls">
                      <button
                        type="button"
                        className="voice-action-btn voice-action-secondary"
                        onClick={startRecording}
                      >
                        <Mic size={14} /> Re-record
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="voice-status">
                      <span>Tap to speak your side of the story</span>
                    </div>
                    <div className="voice-controls">
                      <button type="button" className="voice-action-btn" onClick={startRecording}>
                        <Mic size={16} /> Start recording
                      </button>
                    </div>
                  </>
                )}

                {micError && <p className="auth-error" style={{ margin: '8px 0 0' }}>{micError}</p>}
              </div>
            ) : (
              <>
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="What is your side of the story? What do you remember?"
                />

                {photos.length > 0 && (
                  <div className="capture-photo-strip">
                    {photos.map((photo, index) => (
                      <div className="capture-photo-thumb" key={photo.preview || photo.originalName}>
                        {photo.isPdf ? (
                          <div className="capture-pdf-thumb">
                            <span className="capture-pdf-ext">PDF</span>
                          </div>
                        ) : (
                          <img src={photo.preview} alt="Attached media" />
                        )}
                        <button
                          type="button"
                          className="capture-photo-remove"
                          onClick={() => removePhoto(index)}
                          disabled={busy}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {error && <p className="auth-error">{error}</p>}

            <div className="capture-tools">
              {mode === 'voice' ? (
                <button type="button" onClick={() => setMode('text')}>
                  Switch to text writing
                </button>
              ) : (
                <>
                  <label className="capture-photo-input">
                    <Camera size={17} /> Camera
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={onFileChange}
                      disabled={busy || photos.length >= MAX_MEDIA_PER_MEMORY}
                    />
                  </label>
                  <label className="capture-photo-input">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      multiple
                      hidden
                      onChange={onFileChange}
                      disabled={busy}
                    />
                    <ImageIcon size={18} /> Attach Photo / Doc
                  </label>
                  <button type="button" onClick={() => setMode('voice')}>
                    <Mic size={17} /> Voice
                  </button>
                </>
              )}
            </div>

            <p className="capture-hint">
              {mode === 'voice'
                ? 'Voice perspectives are transcribed and saved to the shared memory.'
                : `Add your thoughts, photos, and voice to complete this moment together.`}
            </p>

            <div className="inference">
              <CustomBrainIcon size={14} />
              <span>Thenvue connects all perspectives into one rich memory.</span>
            </div>

            <button
              className="save-memory"
              onClick={handleProceedToDestinationChoice}
              disabled={busy || (mode === 'voice' && !recordedBlob)}
            >
              {busy
                ? optimizing
                  ? 'Preparing media...'
                  : 'Saving...'
                : 'Add to Memory'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

async function optimizeImage(source: File): Promise<PendingPhoto> {
  const sourceUrl = URL.createObjectURL(source)
  const image = new Image()
  image.decoding = 'async'
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('That image could not be read.'))
      image.src = sourceUrl
    })

    if (image.naturalWidth * image.naturalHeight > MAX_SOURCE_PIXELS) {
      throw new Error('Each image must be under 32 megapixels.')
    }

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image optimization is unavailable in this browser.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await compressedWebp(canvas)
    if (blob.size > MAX_MEDIA_BYTES) {
      throw new Error('That image is still too large after optimization.')
    }

    const baseName = source.name.replace(/\.[^.]+$/, '').replace(/[\\/\u0000]/g, '_').trim() || 'photo'
    const file = new File([blob], `${baseName}.webp`, { type: 'image/webp' })
    return { file, preview: URL.createObjectURL(file), originalName: source.name.slice(0, 255) || 'photo.webp' }
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

async function compressedWebp(canvas: HTMLCanvasElement) {
  for (const quality of [0.84, 0.74, 0.64, 0.54]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
    if (blob && blob.size <= MAX_MEDIA_BYTES) return blob
  }
  throw new Error('That image could not be compressed enough to upload.')
}
