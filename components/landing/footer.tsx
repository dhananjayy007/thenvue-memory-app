'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, X } from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

export function LandingFooter() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  return (
    <footer className="landing-clean-footer">
      <div className="landing-footer-grid">
        {/* Brand Column */}
        <div className="landing-footer-brand-col">
          <Link href="/" className="landing-footer-logo">
            <ThenvueLogo size={24} />
            <span>Thenvue</span>
          </Link>
          <p className="landing-footer-quiet-tag">Your life, remembered.</p>
        </div>

        {/* Product Column */}
        <div className="landing-footer-col">
          <span className="footer-col-title">Product</span>
          <Link href="/voice-journal" className="landing-footer-link">
            Voice Journal
          </Link>
          <Link href="/ai-memory-search" className="landing-footer-link">
            AI Memory Search
          </Link>
          <Link href="/android" className="landing-footer-link">
            Android APK
          </Link>
          <Link href="/ios" className="landing-footer-link">
            iOS Waitlist
          </Link>
          <Link href="/help" className="landing-footer-link">
            Help & Support
          </Link>
        </div>

        {/* Trust & Safety Column */}
        <div className="landing-footer-col">
          <span className="footer-col-title">Trust & Safety</span>
          <Link href="/privacy" className="landing-footer-link">
            Privacy Policy
          </Link>
          <Link href="/ai-data" className="landing-footer-link">
            AI & Data
          </Link>
          <Link href="/account-data" className="landing-footer-link">
            Account & Data
          </Link>
        </div>

        {/* Company & Legal Column */}
        <div className="landing-footer-col">
          <span className="footer-col-title">Company & Legal</span>
          <Link href="/terms" className="landing-footer-link">
            Terms of Service
          </Link>
          <Link href="/contact" className="landing-footer-link">
            Contact
          </Link>
        </div>
      </div>

      {/* Copyright Line */}
      <div className="landing-footer-bottom-row">
        <span>© {new Date().getFullYear()} Thenvue. All rights reserved.</span>
      </div>

      {/* Privacy & Principles Modal */}
      {showPrivacyModal && (
        <div className="overlay" style={{ alignItems: 'center' }}>
          <div className="detail-modal" style={{ maxWidth: 540, maxHeight: '85vh' }}>
            <header>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                <Shield size={16} />
                <strong style={{ color: 'var(--foreground)' }}>Thenvue Privacy & Principles</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </header>

            <article style={{ marginTop: 20, fontSize: 14, lineHeight: 1.6 }}>
              <h2 style={{ font: '22px Georgia, serif', margin: '0 0 10px' }}>
                Your memories are private property.
              </h2>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 16 }}>
                Thenvue was created on the premise that personal memories, voice notes, and daily
                reflections should never be commercialized, mined for advertisements, or exposed to
                third parties.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--foreground)' }}>
                    1. Database Isolation
                  </strong>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                    Every memory is strictly bound to your authenticated account using Row-Level Security.
                  </span>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--foreground)' }}>
                    2. Private AI Processing
                  </strong>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                    Query reflections operate strictly on your retrieved entries and are not used to train public AI models.
                  </span>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--foreground)' }}>
                    3. Content Ownership
                  </strong>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                    You own your content. You can view, edit, or delete your entries at any time.
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 26, textAlign: 'right' }}>
                <button
                  type="button"
                  className="save-memory"
                  style={{ width: 'auto', padding: '9px 22px' }}
                  onClick={() => setShowPrivacyModal(false)}
                >
                  Understood
                </button>
              </div>
            </article>
          </div>
        </div>
      )}
    </footer>
  )
}
