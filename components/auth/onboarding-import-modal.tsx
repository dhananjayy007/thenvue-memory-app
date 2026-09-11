'use client'

import React from 'react'
import {
  Film,
  Camera,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  X,
} from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

interface OnboardingImportModalProps {
  isOpen: boolean
  onImportYes: () => void
  onNotNow: () => void
}

export function OnboardingImportModal({
  isOpen,
  onImportYes,
  onNotNow,
}: OnboardingImportModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-import-title">
      <div className="onboarding-modal-card import-onboarding-card">
        {/* Top Header */}
        <div className="onboarding-header">
          <div className="onboarding-brand">
            <div className="onboarding-brand-circle">
              <ThenvueLogo size={16} />
            </div>
            <span>Thenvue</span>
          </div>

          <button
            type="button"
            className="onboarding-skip-btn"
            onClick={onNotNow}
            aria-label="Dismiss onboarding"
          >
            Not now
          </button>
        </div>

        {/* Body Content */}
        <div className="onboarding-body" style={{ paddingBottom: 8 }}>
          <div className="onboarding-text-group">
            <span className="onboarding-eyebrow">
              <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
              START YOUR STORY
            </span>
            <h2 id="onboarding-import-title" className="onboarding-title" style={{ fontSize: 26, lineHeight: 1.25 }}>
              Bring in your past memories?
            </h2>
            <p className="onboarding-desc">
              Your story didn&apos;t start today. Bring in historical photos from your camera roll or past journals to instantly reconstruct your personal timeline with automated date and place detection.
            </p>
          </div>

          {/* Visual Showcase Card */}
          <div className="onboarding-visual-area">
            <div className="onboarding-visual-card import-visual-card">
              <div className="import-preview-badges">
                <div className="import-preview-badge">
                  <Camera size={13} />
                  <span>Up to 50 Photos</span>
                </div>
                <div className="import-preview-badge">
                  <Calendar size={13} />
                  <span>Auto Date Detection</span>
                </div>
                <div className="import-preview-badge">
                  <MapPin size={13} />
                  <span>GPS Places</span>
                </div>
              </div>

              <div className="import-feature-items">
                <div className="import-feature-item">
                  <CheckCircle2 size={16} className="import-check-icon" />
                  <div>
                    <strong>Intelligent clustering</strong>
                    <p>Photos taken at the same event or place are grouped together into memories.</p>
                  </div>
                </div>
                <div className="import-feature-item">
                  <CheckCircle2 size={16} className="import-check-icon" />
                  <div>
                    <strong>Calendar-accurate dates</strong>
                    <p>EXIF camera timestamps and photo filenames place each moment on its real day.</p>
                  </div>
                </div>
                <div className="import-feature-item">
                  <CheckCircle2 size={16} className="import-check-icon" />
                  <div>
                    <strong>Private & isolated</strong>
                    <p>Stored privately in your encrypted vault. Never shared or used for public training.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="onboarding-footer import-modal-footer">
          <button
            type="button"
            className="onboarding-secondary-btn"
            onClick={onNotNow}
          >
            Not now
          </button>

          <button
            type="button"
            className="onboarding-primary-btn import-primary-cta"
            onClick={onImportYes}
          >
            <Film size={16} />
            <span>Yes, import memories</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
