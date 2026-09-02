'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import type { Memory, MediaAsset } from '@/types/memory'
import { addPhotoToMemoryAction } from '@/app/memories/actions'

interface PhotoUploadModalProps {
  memory: Memory | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (memoryId: string, newMedia: MediaAsset) => void
}

export function PhotoUploadModal({
  memory,
  isOpen,
  onClose,
  onSuccess,
}: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<{
    base64: string
    fileName: string
    fileSize: number
    previewUrl: string
  } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen || !memory) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      setSelectedFile({
        base64,
        fileName: file.name,
        fileSize: file.size,
        previewUrl: result,
      })
    }
    reader.onerror = () => {
      setError('Failed to read file.')
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !memory) return
    setUploading(true)
    setError(null)

    try {
      const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      const newMedia = await addPhotoToMemoryAction({
        memoryId: memory.id,
        memoryDate: memory.date,
        photoBase64: selectedFile.base64,
        fileName: selectedFile.fileName,
        fileSize: selectedFile.fileSize,
        clientTimezone: clientTz,
      })

      onSuccess(memory.id, newMedia)
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to attach photo to memory.')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setError(null)
    setUploading(false)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="detail-modal photo-upload-card" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="photo-modal-title">
            <Camera size={18} />
            <span>Add photo to memory</span>
          </div>
          <button type="button" className="close-btn" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="photo-modal-body">
          <p className="photo-modal-memory-text">&ldquo;{memory.text}&rdquo;</p>

          {error && <div className="photo-modal-error">{error}</div>}

          {selectedFile ? (
            <div className="photo-preview-box">
              <img src={selectedFile.previewUrl} alt="Preview" className="photo-preview-img" />
              <button
                type="button"
                className="photo-remove-preview"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                <X size={14} /> Remove photo
              </button>
            </div>
          ) : (
            <div
              className="photo-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Upload size={28} />
              <p>Click or drag to choose a photo</p>
              <small>Supports JPEG, PNG, WebP up to 10MB</small>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="voice-action-btn"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Attaching...
              </>
            ) : (
              'Attach Photo'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
