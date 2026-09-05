'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  UploadCloud,
  Film,
  Check,
  Calendar,
  Clock,
  MapPin,
  Users,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  ArrowRight,
  Edit3,
} from 'lucide-react'
import type { Memory, MemoryClusterCandidate, PastImportQuota } from '@/types/memory'
import {
  getPastImportQuotaAction,
  createImportJobAction,
  uploadAndProcessPastPhotosAction,
  saveRediscoveredMemoryAction,
  enrichMemoryAction,
  type RawPastPhotoInput,
} from '@/app/memories/actions'
import { extractPhotoMetadata } from '@/lib/photo-date-extractor'
import { createClient } from '@/lib/supabase/client'

type FilePreview = {
  file: File
  previewUrl: string
  fileName: string
  fileSize: number
  capturedAt?: string | null
  capturedDate?: string | null
  capturedTime?: string | null
  dateSource?: string | null
  dateStatus?: 'exact' | 'inferred' | 'unknown'
  nativeCreationDate?: string | null
  latitude?: number | null
  longitude?: number | null
}

export function RediscoverImportModal({
  isOpen,
  onClose,
  onMemoryCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onMemoryCreated: (memory: Memory) => void
}) {
  const [quota, setQuota] = useState<PastImportQuota>({ used: 0, limit: 100, remaining: 100 })
  const [stage, setStage] = useState<'select' | 'processing' | 'review'>('select')
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([])
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing past photos...')
  const [processingStep, setProcessingStep] = useState<number>(1)
  const [candidates, setCandidates] = useState<MemoryClusterCandidate[]>([])
  const [duplicateCount, setDuplicateCount] = useState<number>(0)
  const [failedCount, setFailedCount] = useState<number>(0)
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null)
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      getPastImportQuotaAction().then(setQuota).catch(console.error)
      setStage('select')
      setSelectedFiles([])
      setCandidates([])
      setDuplicateCount(0)
      setFailedCount(0)
      setErrorMessage(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setErrorMessage(null)

    const maxAllowed = quota.remaining
    if (maxAllowed <= 0) {
      setErrorMessage("You've reached your 100 past-photo limit.")
      return
    }

    const fileArray = Array.from(files)
    if (fileArray.length > maxAllowed) {
      setErrorMessage(`You can select up to ${maxAllowed} more past photos (quota: ${quota.used}/100).`)
    }

    const allowedFiles = fileArray.slice(0, maxAllowed)
    const previews: FilePreview[] = []

    for (const file of allowedFiles) {
      if (!file.type.startsWith('image/')) continue

      // Read buffer for EXIF only (NO Base64 conversion)
      const arrayBuffer = await file.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      const previewUrl = URL.createObjectURL(file)

      // Extract metadata with strict priority (EXIF -> Filename -> Unknown)
      // NEVER pass file.lastModified as capture date (Rule 2)
      const extracted = extractPhotoMetadata({
        buffer: uint8,
        fileName: file.name,
      })

      previews.push({
        file,
        previewUrl,
        fileName: file.name,
        fileSize: file.size,
        capturedAt: extracted.capturedAt,
        capturedDate: extracted.capturedDate,
        capturedTime: extracted.capturedTime,
        dateSource: extracted.dateSource,
        dateStatus: extracted.dateStatus,
        nativeCreationDate: null,
        latitude: extracted.latitude ?? null,
        longitude: extracted.longitude ?? null,
      })
    }

    setSelectedFiles((prev) => [...prev, ...previews].slice(0, maxAllowed))
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].previewUrl)
      updated.splice(index, 1)
      return updated
    })
  }

  const handleStartProcessing = async () => {
    if (selectedFiles.length === 0) return
    setStage('processing')
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Step 1: Create Job
      setProcessingStep(1)
      setProcessingStatus(`Validating ${selectedFiles.length} past photo${selectedFiles.length === 1 ? '' : 's'} with server quota...`)
      const { jobId } = await createImportJobAction(selectedFiles.length)

      // Step 2: Direct parallel upload to Supabase Storage (P0 & P3: Concurrency limit 5)
      setProcessingStep(2)
      setProcessingStatus('Uploading photos directly to storage...')

      const rawInputs: RawPastPhotoInput[] = []
      const UPLOAD_CONCURRENCY = 5

      for (let i = 0; i < selectedFiles.length; i += UPLOAD_CONCURRENCY) {
        const chunk = selectedFiles.slice(i, i + UPLOAD_CONCURRENCY)
        const chunkResults = await Promise.all(
          chunk.map(async (f) => {
            const ext = f.fileName.split('.').pop()?.toLowerCase() || 'jpg'
            const storagePath = `rediscover/${user.id}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`
            const contentType = f.file.type || 'image/jpeg'

            const { error: uploadError } = await supabase.storage
              .from('memory-photos')
              .upload(storagePath, f.file, { contentType, upsert: false })

            if (uploadError) {
              console.warn('Storage upload error for photo:', f.fileName, uploadError)
              return null
            }

            return {
              storagePath,
              fileName: f.fileName,
              fileSize: f.fileSize,
              mimeType: contentType,
              capturedAt: f.capturedAt,
              capturedDate: f.capturedDate,
              capturedTime: f.capturedTime,
              dateSource: f.dateSource,
              dateStatus: f.dateStatus,
              nativeCreationDate: f.nativeCreationDate,
              latitude: f.latitude,
              longitude: f.longitude,
            }
          })
        )

        for (const res of chunkResults) {
          if (res) rawInputs.push(res)
        }
      }

      if (rawInputs.length === 0) {
        throw new Error('Failed to upload past photos to storage.')
      }

      // Step 3: Cluster & Understand via lightweight metadata payload (<10KB)
      setProcessingStep(3)
      setProcessingStatus('Clustering moments & generating AI memory understanding...')

      const result = await uploadAndProcessPastPhotosAction({
        jobId,
        photos: rawInputs,
      })

      setDuplicateCount(result.duplicateCount)
      setFailedCount(result.failedCount)
      setCandidates(result.candidates)
      setStage('review')
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process past photos.')
      setStage('select')
    }
  }

  const handleSaveCandidate = async (candidate: MemoryClusterCandidate) => {
    if (!candidate.suggestedDate) {
      setErrorMessage('Please choose a capture date for this moment before saving.')
      setEditingCandidateId(candidate.id)
      return
    }

    setSavingCandidateId(candidate.id)
    setErrorMessage(null)
    try {
      // P2: Save core memory immediately (<300ms)
      const savedMemory = await saveRediscoveredMemoryAction({
        clusterId: candidate.id,
        title: candidate.title,
        story: candidate.summary,
        date: candidate.suggestedDate,
        time: candidate.suggestedTime || '12:00:00',
        place: candidate.locationName,
        people: candidate.people,
        topics: candidate.topics,
        mood: candidate.mood,
        storagePaths: candidate.assets.map((a) => a.storagePath),
      })

      // Add to timeline immediately with processing state
      onMemoryCreated(savedMemory)

      // Trigger background AI enrichment (non-blocking)
      enrichMemoryAction(savedMemory.id).catch((e) => console.warn('Background enrichment error:', e))

      // Remove from candidate list
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))

      // Refresh quota
      getPastImportQuotaAction().then(setQuota).catch(console.error)

      if (candidates.length <= 1) {
        onClose()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not save memory.')
    } finally {
      setSavingCandidateId(null)
    }
  }

  const handleDismissCandidate = (candidateId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId))
    if (candidates.length <= 1) {
      onClose()
    }
  }

  const handleUpdateCandidateField = (
    candidateId: string,
    field: keyof MemoryClusterCandidate,
    value: any
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c
        const updated = { ...c, [field]: value }
        if (field === 'suggestedDate' && value) {
          updated.dateStatus = 'exact'
        }
        return updated
      })
    )
  }

  const handleRemoveAssetFromCandidate = (candidateId: string, assetId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c
        const remainingAssets = c.assets.filter((a) => a.id !== assetId)
        return { ...c, assets: remainingAssets, photoCount: remainingAssets.length }
      })
    )
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && stage !== 'processing' && onClose()}>
      <div className="capture-modal rediscover-modal">
        {/* Modal Header */}
        <div className="rediscover-modal-header">
          <div className="rediscover-header-left">
            <div className="rediscover-icon-wrap">
              <Film size={18} />
            </div>
            <div>
              <h3>Rediscover Your Past</h3>
              <p className="rediscover-modal-sub">
                {stage === 'select' && `Select old photos (up to ${quota.remaining} slots available)`}
                {stage === 'processing' && 'Reconstructing your memories...'}
                {stage === 'review' && 'Review the moments found from your past photos'}
              </p>
            </div>
          </div>
          {stage !== 'processing' && (
            <button className="icon-button" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="rediscover-error-banner">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stage 1: File Selection */}
        {stage === 'select' && (
          <div className="rediscover-select-stage">
            {/* Drop / Pick Area */}
            <div
              className="rediscover-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFilesSelected(e.dataTransfer.files)
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <UploadCloud size={36} className="dropzone-icon" />
              <h4>Choose past photos from your device</h4>
              <p>Drag & drop or tap to browse your camera roll / albums</p>
              <span className="quota-tag-pill">
                {quota.remaining} past photo slot{quota.remaining === 1 ? '' : 's'} available
              </span>
            </div>

            {/* Selected files preview grid */}
            {selectedFiles.length > 0 && (
              <div className="selected-files-section">
                <div className="selected-files-header">
                  <strong>Selected Photos ({selectedFiles.length})</strong>
                  <button
                    className="clear-all-btn"
                    onClick={() => {
                      selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
                      setSelectedFiles([])
                    }}
                  >
                    Clear All
                  </button>
                </div>
                <div className="selected-files-grid">
                  {selectedFiles.map((file, idx) => (
                    <div key={file.previewUrl + idx} className="selected-file-card">
                      <img src={file.previewUrl} alt={file.fileName} />
                      <button
                        className="remove-file-badge"
                        onClick={() => handleRemoveSelectedFile(idx)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="rediscover-select-footer">
              <button className="outline-button" onClick={onClose}>
                Cancel
              </button>
              <button
                className="solid-button"
                disabled={selectedFiles.length === 0}
                onClick={handleStartProcessing}
              >
                <span>Process {selectedFiles.length} Past Photo{selectedFiles.length === 1 ? '' : 's'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Stage 2: Processing Animation */}
        {stage === 'processing' && (
          <div className="rediscover-processing-stage">
            <div className="processing-spinner-wrap">
              <div className="pulse-glow" />
              <Film size={36} className="processing-sparkle" />
            </div>
            <h4>Rediscovering your past...</h4>
            <p className="processing-status-label">{processingStatus}</p>

            <div className="processing-steps-list">
              <div className={`step-item ${processingStep >= 1 ? 'active' : ''}`}>
                <Check size={14} className="step-check" />
                <span>1. Verifying quota & uploads</span>
              </div>
              <div className={`step-item ${processingStep >= 2 ? 'active' : ''}`}>
                <Check size={14} className="step-check" />
                <span>2. Detecting duplicates & extracting dates</span>
              </div>
              <div className={`step-item ${processingStep >= 3 ? 'active' : ''}`}>
                <Check size={14} className="step-check" />
                <span>3. Clustering moments & AI understanding</span>
              </div>
            </div>
          </div>
        )}

        {/* Stage 3: Candidate Moments Review */}
        {stage === 'review' && (
          <div className="rediscover-review-stage">
            {/* Duplicates / failed info */}
            {(duplicateCount > 0 || failedCount > 0) && (
              <div className="review-stats-bar">
                {duplicateCount > 0 && <span>✨ {duplicateCount} duplicate photo{duplicateCount === 1 ? '' : 's'} omitted.</span>}
                {failedCount > 0 && <span>⚠️ {failedCount} photo{failedCount === 1 ? '' : 's'} could not be processed.</span>}
              </div>
            )}

            <div className="candidates-list">
              {candidates.map((candidate) => {
                const isEditing = editingCandidateId === candidate.id
                const isSaving = savingCandidateId === candidate.id

                return (
                  <div key={candidate.id} className="candidate-card">
                    {/* Photos Collage */}
                    <div className="candidate-photos-collage">
                      {candidate.assets.map((asset) => (
                        <div key={asset.id} className="candidate-photo-item">
                          <img src={asset.url} alt="Past photo" />
                          <button
                            className="candidate-photo-remove"
                            title="Remove photo"
                            onClick={() => handleRemoveAssetFromCandidate(candidate.id, asset.id)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Candidate Details */}
                    <div className="candidate-details">
                      {isEditing ? (
                        <div className="candidate-edit-form">
                          <label>
                            <span>Title</span>
                            <input
                              type="text"
                              value={candidate.title}
                              onChange={(e) => handleUpdateCandidateField(candidate.id, 'title', e.target.value)}
                            />
                          </label>
                          <label>
                            <span>Story / Summary</span>
                            <textarea
                              rows={3}
                              value={candidate.summary}
                              onChange={(e) => handleUpdateCandidateField(candidate.id, 'summary', e.target.value)}
                            />
                          </label>
                          <div className="edit-form-row">
                            <label>
                              <span>Capture Date (Required)</span>
                              <input
                                type="date"
                                required
                                value={candidate.suggestedDate || ''}
                                onChange={(e) => handleUpdateCandidateField(candidate.id, 'suggestedDate', e.target.value)}
                              />
                            </label>
                            <label>
                              <span>Capture Time</span>
                              <input
                                type="time"
                                value={candidate.suggestedTime?.slice(0, 5) || '12:00'}
                                onChange={(e) => handleUpdateCandidateField(candidate.id, 'suggestedTime', e.target.value)}
                              />
                            </label>
                          </div>
                          <div className="edit-form-row">
                            <label>
                              <span>Location</span>
                              <input
                                type="text"
                                value={candidate.locationName}
                                placeholder="e.g. Goa, India"
                                onChange={(e) => handleUpdateCandidateField(candidate.id, 'locationName', e.target.value)}
                              />
                            </label>
                            <label>
                              <span>People (comma separated)</span>
                              <input
                                type="text"
                                value={candidate.people?.join(', ') || ''}
                                placeholder="e.g. Mom, Rahul"
                                onChange={(e) =>
                                  handleUpdateCandidateField(
                                    candidate.id,
                                    'people',
                                    e.target.value.split(',').map((p) => p.trim()).filter(Boolean)
                                  )
                                }
                              />
                            </label>
                          </div>
                          <button
                            className="outline-button done-edit-btn"
                            onClick={() => setEditingCandidateId(null)}
                          >
                            Done Editing
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="candidate-header-row">
                            <div className="candidate-meta-badges">
                              {candidate.suggestedDate ? (
                                <span className={`candidate-badge ${candidate.dateStatus === 'inferred' ? 'inferred-badge' : 'exact-badge'}`}>
                                  <Calendar size={12} />
                                  <span>{candidate.suggestedDate}</span>
                                  {candidate.suggestedTime && candidate.suggestedTime !== '12:00' && candidate.suggestedTime !== '12:00:00' && (
                                    <>
                                      <Clock size={11} style={{ marginLeft: 4 }} />
                                      <span>{candidate.suggestedTime.slice(0, 5)}</span>
                                    </>
                                  )}
                                  <small style={{ opacity: 0.85, marginLeft: 5 }}>
                                    {candidate.dateSource === 'filename'
                                      ? '· Date inferred from filename'
                                      : '· Date from photo metadata'}
                                  </small>
                                </span>
                              ) : (
                                <span className="candidate-badge warning-badge" style={{ color: '#ef4444', borderColor: '#fca5a5', fontWeight: 600 }}>
                                  <AlertCircle size={12} /> Date unknown — choose a date
                                </span>
                              )}
                              {candidate.locationName && (
                                <span className="candidate-badge">
                                  <MapPin size={12} /> {candidate.locationName}
                                </span>
                              )}
                              {candidate.people?.length > 0 && (
                                <span className="candidate-badge">
                                  <Users size={12} /> {candidate.people.join(', ')}
                                </span>
                              )}
                              <span className="candidate-badge count-badge">
                                <ImageIcon size={12} /> {candidate.assets.length} photo{candidate.assets.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <button
                              className="edit-candidate-btn"
                              onClick={() => setEditingCandidateId(candidate.id)}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                          </div>

                          <h4 className="candidate-title">{candidate.title}</h4>
                          <p className="candidate-summary">{candidate.summary}</p>

                          {candidate.topics.length > 0 && (
                            <div className="candidate-tags">
                              {candidate.topics.map((t) => (
                                <span key={t} className="candidate-tag">#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Candidate Action Buttons */}
                      <div className="candidate-actions">
                        <button
                          className="solid-button save-memory-btn"
                          disabled={isSaving || candidate.assets.length === 0 || !candidate.suggestedDate}
                          onClick={() => handleSaveCandidate(candidate)}
                        >
                          <Check size={15} />
                          <span>
                            {isSaving
                              ? 'Saving to Memories...'
                              : !candidate.suggestedDate
                              ? 'Select Date to Save'
                              : 'Looks Right — Save Memory'}
                          </span>
                        </button>
                        <button
                          className="ghost-button dismiss-btn"
                          onClick={() => handleDismissCandidate(candidate.id)}
                        >
                          Not a Memory
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {candidates.length === 0 && (
                <div className="empty-state">
                  <p>All discovered moments reviewed and saved!</p>
                  <button className="solid-button" onClick={onClose}>
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
