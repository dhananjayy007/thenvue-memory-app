'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { CalendarDays, Camera, Image as ImageIcon, Mic, MapPin,  X } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'
import { createClient } from '@/lib/supabase/client'
import { currentCaptureTime, MAX_MEDIA_BYTES, MAX_MEDIA_PER_MEMORY } from '@/lib/memories'
import type { MemoryCaptureTime, NewMediaInput } from '@/types/memory'
import { optimizePdf } from '@/lib/pdf-optimizer'
import { MentionAutocomplete } from '@/components/memory/mention-autocomplete'

const MAX_SOURCE_BYTES = 12 * 1024 * 1024
const MAX_SOURCE_PIXELS = 32_000_000
const MAX_IMAGE_DIMENSION = 2048
const SUPPORTED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

type PendingPhoto = { file: File; preview: string; originalName: string; isPdf?: boolean }

export function Capture({
  draft,
  setDraft,
  onClose,
  onSave,
  onSaveVoice,
  saving,
  initialMode = 'text',
}: {
  draft: string
  setDraft: (v: string) => void
  onClose: () => void
  onSave: (media: NewMediaInput[], capturedAt: MemoryCaptureTime, place?: string) => Promise<void>
  onSaveVoice?: (params: {
    audioBase64: string
    mimeType: string
    fileName: string
    fileSize: number
    capturedAt: MemoryCaptureTime
  }) => Promise<void>
  saving?: boolean
  initialMode?: 'text' | 'voice'
}) {
  const [mode, setMode] = useState<'text' | 'voice'>(initialMode)
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Custom Date and Location State
  const [customPlace, setCustomPlace] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [showPlaceInput, setShowPlaceInput] = useState(false)
  const [showDateInput, setShowDateInput] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  
  // PDF specific state
  const [showPdfWarning, setShowPdfWarning] = useState(false)
  const [pendingPdfFiles, setPendingPdfFiles] = useState<File[]>([])
  const [dontShowPdfWarning, setDontShowPdfWarning] = useState(false)

  const photosRef = useRef<PendingPhoto[]>([])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => () => {
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview))
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [audioUrl])

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
      setMicError('Microphone access was denied. Please allow microphone access to record voice memories.')
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

  const handleVoiceSave = async () => {
    if (!recordedBlob || !onSaveVoice) return
    setUploading(true)
    setMicError(null)
    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string
          const base64 = res.split(',')[1] || ''
          resolve(base64)
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(recordedBlob)
      const audioBase64 = await base64Promise

      await onSaveVoice({
        audioBase64,
        mimeType: recordedBlob.type || 'audio/webm',
        fileName: `voice_${new Date().toISOString().slice(0, 10)}.webm`,
        fileSize: recordedBlob.size,
        capturedAt: currentCaptureTime(),
      })
    } catch (err) {
      setMicError(err instanceof Error ? err.message : 'Could not save voice memory.')
    } finally {
      setUploading(false)
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
      setPhotoError(`You can add up to ${MAX_MEDIA_PER_MEMORY} photos.`)
      return
    }

    setOptimizing(true)
    const prepared: PendingPhoto[] = []
    
    // Check if any PDFs are being uploaded and if we need to show the warning
    const hasPdfs = files.some(f => f.type === 'application/pdf')
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
      setPhotoError(null)
      setPhotos((previous) => [...previous, ...prepared])
    } catch (error) {
      prepared.forEach((photo) => URL.revokeObjectURL(photo.preview))
      setPhotoError(error instanceof Error ? error.message : 'Could not prepare those photos.')
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

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setPhotoError('Geolocation is not supported by your browser.')
      return
    }
    setDetectingLocation(true)
    setPhotoError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || ''
          const state = data.address?.state || ''
          const loc = [city, state].filter(Boolean).join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          setCustomPlace(loc)
          setShowPlaceInput(false)
        } catch {
          setCustomPlace('Current Location')
          setShowPlaceInput(false)
        } finally {
          setDetectingLocation(false)
        }
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setDetectingLocation(false)
        setPhotoError('Could not access your location. You can type it manually.')
      },
      { timeout: 8000 }
    )
  }

  const handleSave = async () => {
    if (mode === 'voice') {
      await handleVoiceSave()
      return
    }

    if (!draft.trim()) {
      setPhotoError('Write something before saving this memory.')
      return
    }

    const now = new Date()
    const defaultDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const capturedAt: MemoryCaptureTime = {
      date: customDate.trim() || defaultDate,
      time: customTime.trim() || defaultTime,
    }

    const placeToSave = customPlace.trim() || undefined

    if (photos.length === 0) {
      try {
        await onSave([], capturedAt, placeToSave)
      } catch (error) {
        setPhotoError(error instanceof Error ? error.message : 'Could not save memory.')
      }
      return
    }

    setUploading(true)
    setPhotoError(null)
    const uploadedPaths: string[] = []
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const media: NewMediaInput[] = []
      for (const photo of photos) {
        const ext = photo.isPdf ? 'pdf' : 'webp'
        const contentType = photo.isPdf ? 'application/pdf' : 'image/webp'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        
        const { error: uploadError } = await supabase.storage
          .from('memory-photos')
          .upload(path, photo.file, { contentType, cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        uploadedPaths.push(path)
        media.push({
          storagePath: path,
          mediaType: photo.isPdf ? 'document' : 'image',
          fileName: photo.originalName,
          fileSize: photo.file.size,
        })
      }

      await onSave(media, capturedAt, placeToSave)
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await createClient().storage.from('memory-photos').remove(uploadedPaths)
      }
      setPhotoError(error instanceof Error ? error.message : 'Could not upload photos.')
    } finally {
      setUploading(false)
    }
  }

  const busy = saving || uploading || optimizing

  return (
    <div className="overlay">
      <div className="capture-modal">
        {showPdfWarning ? (
          <header className="capture-header">
            <span className="capture-header-title">Attachment Notice</span>
            <button type="button" className="capture-close" onClick={() => {
              setShowPdfWarning(false)
              setPendingPdfFiles([])
            }} aria-label="Close">
              <X size={18} />
            </button>
          </header>
        ) : (
          <header className="capture-header">
            <span className="capture-header-title">{mode === 'voice' ? 'Record a voice memory' : 'Capture a memory'}</span>
            <button type="button" className="capture-close" onClick={onClose} disabled={busy} aria-label="Close">
              <X size={18} />
            </button>
          </header>
        )}

        {showPdfWarning ? (
          <div className="capture-pdf-warning">
            <p>
              To save storage space and ensure fast syncing, your PDF will be heavily compressed. 
              This process turns the PDF into high-quality images, meaning <strong>the text will no longer be highlightable or searchable</strong> by regular PDF readers.
            </p>
            <p>Do you want to proceed with this compression?</p>
            
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
        ) : mode === 'voice' ? (
          <div className="voice-box">
            {isRecording ? (
              <>
                <div className="voice-status">
                  <span className="pulse-dot" />
                  <span>Recording your voice...</span>
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
                  <span>Voice recording ready ({formatTimer(recordingDuration)})</span>
                </div>
                <audio
                  ref={audioElementRef}
                  src={audioUrl}
                  onPlay={() => setIsPlayingAudio(true)}
                  onPause={() => setIsPlayingAudio(false)}
                  onEnded={() => setIsPlayingAudio(false)}
                  controls
                  style={{ width: '100%', maxWidth: 360 }}
                />
                <div className="voice-controls">
                  <button type="button" className="voice-action-btn voice-action-secondary" onClick={startRecording}>
                    <Mic size={14} /> Re-record
                  </button>
                  <button
                    type="button"
                    className="voice-action-btn"
                    onClick={handleVoiceSave}
                    disabled={busy}
                  >
                    {busy ? 'Transcribing & saving...' : 'Save voice memory'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="voice-status">
                  <span>Tap to start speaking your memory</span>
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
          <div style={{ position: 'relative', width: '100%' }}>
            <textarea
              ref={textareaRef}
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What happened? (Type @ to tag a friend)"
            />
            <MentionAutocomplete
              textareaRef={textareaRef}
              value={draft}
              onChange={setDraft}
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
                      // eslint-disable-next-line @next/next/no-img-element
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
          </div>
        )}

        {photoError && <p className="auth-error">{photoError}</p>}

        {/* Optional Custom Location and Date Inputs / Chips */}
        {(customPlace || customDate || showPlaceInput || showDateInput) && (
          <div className="capture-metadata-bar">
            {showPlaceInput ? (
              <div className="capture-inline-input-group">
                <MapPin size={14} className="capture-inline-icon" />
                <input
                  type="text"
                  className="capture-inline-input"
                  placeholder="Where did this happen? (e.g. Bandra, Mumbai)"
                  value={customPlace}
                  onChange={(e) => setCustomPlace(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="capture-inline-detect-btn"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  title="Detect GPS location"
                >
                  {detectingLocation ? 'Locating...' : 'GPS'}
                </button>
                <button
                  type="button"
                  className="capture-inline-done-btn"
                  onClick={() => setShowPlaceInput(false)}
                >
                  Done
                </button>
              </div>
            ) : customPlace ? (
              <span className="capture-active-chip" onClick={() => setShowPlaceInput(true)}>
                <MapPin size={13} />
                <span>{customPlace}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCustomPlace('')
                  }}
                  title="Remove location"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null}

            {showDateInput ? (
              <div className="capture-inline-input-group">
                <CalendarDays size={14} className="capture-inline-icon" />
                <input
                  type="date"
                  className="capture-inline-date-input"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
                <input
                  type="time"
                  className="capture-inline-time-input"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                />
                <button
                  type="button"
                  className="capture-inline-done-btn"
                  onClick={() => setShowDateInput(false)}
                >
                  Done
                </button>
              </div>
            ) : customDate ? (
              <span className="capture-active-chip" onClick={() => setShowDateInput(true)}>
                <CalendarDays size={13} />
                <span>{customDate} {customTime ? `· ${customTime}` : ''}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCustomDate('')
                    setCustomTime('')
                  }}
                  title="Reset to today"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null}
          </div>
        )}

        <div className="capture-tools">
          {mode === 'voice' ? (
            <button type="button" onClick={() => setMode('text')}>
              Switch to text capture
            </button>
          ) : (
            <>
              <label className="capture-photo-input" title="Take a photo with camera" aria-label="Camera">
                <Camera size={18} />
                <span className="capture-tool-label">Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={onFileChange}
                  disabled={busy || photos.length >= MAX_MEDIA_PER_MEMORY}
                />
              </label>
              <label className="capture-photo-input" title="Attach photos or documents" aria-label="Attach Photo / Doc">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  multiple
                  hidden
                  onChange={onFileChange}
                  disabled={busy}
                />
                <ImageIcon size={18} />
                <span className="capture-tool-label">Attach Photo / Doc</span>
              </label>
              <button type="button" onClick={() => setMode('voice')} title="Record voice note" aria-label="Voice">
                <Mic size={18} />
                <span className="capture-tool-label">Voice</span>
              </button>
              <button
                type="button"
                className={customPlace || showPlaceInput ? 'capture-tool-active' : ''}
                onClick={() => {
                  setShowPlaceInput((prev) => !prev)
                  if (showDateInput) setShowDateInput(false)
                }}
                title="Add or edit location"
                aria-label="Location"
              >
                <MapPin size={18} />
                <span className="capture-tool-label">Location</span>
              </button>
              <button
                type="button"
                className={customDate || showDateInput ? 'capture-tool-active' : ''}
                onClick={() => {
                  if (!customDate) {
                    const now = new Date()
                    setCustomDate([now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'))
                    setCustomTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
                  }
                  setShowDateInput((prev) => !prev)
                  if (showPlaceInput) setShowPlaceInput(false)
                }}
                title="Pick custom date and time"
                aria-label="Date"
              >
                <CalendarDays size={18} />
                <span className="capture-tool-label">Date</span>
              </button>
            </>
          )}
        </div>

        <p className="capture-hint">
          {mode === 'voice'
            ? 'Voice recordings are securely stored and transcribed automatically.'
            : `JPG, PNG, or WebP · optimized to WebP · up to ${MAX_MEDIA_PER_MEMORY} photos`}
        </p>

        <div className="inference">
          <CustomBrainIcon size={14} />
          <span>Memory will gently understand the details for you.</span>
        </div>

        <button
          className="save-memory"
          onClick={handleSave}
          disabled={busy || (mode === 'voice' && !recordedBlob)}
        >
          {busy
            ? optimizing
              ? 'Preparing photos...'
              : mode === 'voice'
              ? 'Transcribing & saving...'
              : 'Saving...'
            : mode === 'voice'
            ? 'Save voice memory'
            : 'Save memory'}
        </button>
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
