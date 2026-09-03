'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, ArrowRight } from 'lucide-react'

export interface FeatureTipProps {
  storageKey: string
  title: string
  description: string
  icon?: React.ReactNode
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  secondaryActionLabel?: string
}

export function FeatureTip({
  storageKey,
  title,
  description,
  icon,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel = 'Got it',
}: FeatureTipProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(`thenvue_tip_${storageKey}`)
      if (!seen) {
        const timer = setTimeout(() => setVisible(true), 500)
        return () => clearTimeout(timer)
      }
    } catch {}
  }, [storageKey])

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(`thenvue_tip_${storageKey}`, 'true')
    } catch {}
  }

  const handleAction = () => {
    handleDismiss()
    onPrimaryAction?.()
  }

  if (!visible) return null

  return (
    <div className="feature-tip-card animate-fade-in">
      <div className="feature-tip-header">
        <div className="feature-tip-icon-wrap">
          {icon || <Sparkles size={16} />}
        </div>
        <div className="feature-tip-content">
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <button
          type="button"
          className="feature-tip-close"
          onClick={handleDismiss}
          aria-label="Dismiss tip"
        >
          <X size={14} />
        </button>
      </div>
      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="feature-tip-actions">
          {primaryActionLabel && onPrimaryAction && (
            <button
              type="button"
              className="feature-tip-primary-btn"
              onClick={handleAction}
            >
              <span>{primaryActionLabel}</span>
              <ArrowRight size={13} />
            </button>
          )}
          <button
            type="button"
            className="feature-tip-secondary-btn"
            onClick={handleDismiss}
          >
            {secondaryActionLabel}
          </button>
        </div>
      )}
    </div>
  )
}
