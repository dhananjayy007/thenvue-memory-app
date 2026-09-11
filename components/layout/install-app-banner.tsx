'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Smartphone, ArrowRight, X } from 'lucide-react'

const SESSION_KEY = 'thenvue_session_count'
const DISMISSED_KEY = 'thenvue_install_banner_dismissed'

export function InstallAppBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      // Check dismissal state
      const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
      if (isDismissed) return

      // Session tracking: Increment session count once per session
      const currentSessionCount = parseInt(localStorage.getItem(SESSION_KEY) || '0', 10) + 1
      localStorage.setItem(SESSION_KEY, currentSessionCount.toString())

      // Show only on return sessions (session >= 2) so first-time onboarding is never disturbed
      if (currentSessionCount >= 2) {
        setVisible(true)
      }
    } catch {
      // Ignore localStorage errors in restricted environments
    }
  }, [])

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // Ignore
    }
  }

  if (!visible) return null

  return (
    <aside className="install-app-banner" aria-label="Mobile app announcement">
      <Link href="/install" className="install-banner-link">
        <div className="install-banner-content">
          <div className="install-banner-badge">
            <Smartphone size={13} />
            <span>Mobile App</span>
          </div>
          <p className="install-banner-text">
            <strong>Thenvue is coming to iOS & Android.</strong> Join early beta access or add to home screen
          </p>
          <span className="install-banner-cta">
            <span>Learn more</span>
            <ArrowRight size={13} />
          </span>
        </div>
      </Link>

      <button
        type="button"
        className="install-banner-close"
        onClick={handleDismiss}
        aria-label="Dismiss mobile app announcement"
      >
        <X size={14} />
      </button>
    </aside>
  )
}
