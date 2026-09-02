'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowUpRight, Feather, QrCode, Shield, X } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

export function LandingDownloadFooter() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  // Track scroll position to show Back to Top button past 50% scroll height
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        setShowBackToTop(window.scrollY > scrollHeight * 0.5)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer id="download" className="landing-footer-wrapper">

      {/* High-Converting Download Banner */}
      <div className="landing-download-banner">
        <div className="landing-download-info">
          <div className="landing-eyebrow-pill">DIRECT MOBILE BUILDS</div>
          <h2 className="landing-download-title">Download directly to your device.</h2>
          <p className="landing-download-sub">
            Install Thenvue directly on your iPhone, iPad, or Android device without app store delays.
            Your private timeline syncs securely across all your devices.
          </p>

          <div className="landing-download-buttons">
            <Link
              href="/ios"
              className="landing-store-badge"
            >
              <div className="landing-icon-glow-wrap apple-glow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                  fill="currentColor"
                  width="18"
                  height="18"
                  className="landing-store-icon text-white relative z-10"
                >
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
              </div>
              <div className="landing-store-text">
                <div className="landing-store-title-row">
                  <span className="landing-store-main-title">Download for iOS</span>
                </div>
              </div>
            </Link>


            <Link
              href="/android"
              className="landing-store-badge"
            >
              <div className="landing-icon-glow-wrap android-glow">
                <svg
                  className="landing-store-icon"
                  viewBox="0 0 24 24"
                  width="19"
                  height="19"
                  fill="currentColor"
                >
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-1.428V3.242c0-.55.228-1.049.609-1.428zm11.233 11.234l2.585 2.585-11.458 6.547 8.873-9.132zm0-2.096L5.969 1.82l11.458 6.547-2.585 2.585zm1.48 1.48l3.197-1.827c.883-.504.883-1.325 0-1.83l-3.197-1.827-2.18 2.18 2.18 2.18z" />
                </svg>
              </div>
              <div className="landing-store-text">
                <div className="landing-store-title-row">
                  <span className="landing-store-main-title">Download for Android</span>
                </div>
              </div>
            </Link>
          </div>


          <div className="landing-web-fallback">
            <Link href="/login" className="landing-web-link">
              Prefer the web version? Open Thenvue in Browser <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* QR Code Container for Desktop Visitors */}
        <div className="landing-qr-card">
          <div className="landing-qr-box">
            {/* Styled Crisp QR Graphic */}
            <svg
              viewBox="0 0 100 100"
              width="110"
              height="110"
              className="landing-qr-svg"
              fill="currentColor"
            >
              {/* Corner position markers */}
              <rect x="10" y="10" width="26" height="26" rx="4" fill="#D78368" />
              <rect x="16" y="16" width="14" height="14" rx="2" fill="#1C1E1D" />
              <rect x="20" y="20" width="6" height="6" fill="#D78368" />

              <rect x="64" y="10" width="26" height="26" rx="4" fill="#D78368" />
              <rect x="70" y="16" width="14" height="14" rx="2" fill="#1C1E1D" />
              <rect x="74" y="20" width="6" height="6" fill="#D78368" />

              <rect x="10" y="64" width="26" height="26" rx="4" fill="#D78368" />
              <rect x="16" y="70" width="14" height="14" rx="2" fill="#1C1E1D" />
              <rect x="20" y="74" width="6" height="6" fill="#D78368" />

              {/* Data points */}
              <rect x="42" y="12" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="52" y="12" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="42" y="22" width="6" height="6" rx="1" fill="#D78368" />
              <rect x="52" y="26" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="12" y="44" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="22" y="44" width="6" height="6" rx="1" fill="#D78368" />
              <rect x="32" y="44" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="44" y="44" width="12" height="12" rx="2" fill="#D78368" />
              <rect x="62" y="44" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="74" y="44" width="6" height="6" rx="1" fill="#D78368" />
              <rect x="84" y="44" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="42" y="64" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="52" y="64" width="6" height="6" rx="1" fill="#D78368" />
              <rect x="42" y="74" width="6" height="6" rx="1" fill="#D78368" />
              <rect x="52" y="80" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="64" y="64" width="6" height="6" rx="1" fill="#F5F4F0" />
              <rect x="76" y="64" width="14" height="6" rx="1" fill="#D78368" />
              <rect x="64" y="76" width="12" height="6" rx="1" fill="#F5F4F0" />
              <rect x="80" y="76" width="10" height="14" rx="1" fill="#D78368" />
            </svg>
          </div>
          <span className="landing-qr-label">
            <QrCode size={13} /> Scan to download APK or iOS build directly
          </span>
          <small className="landing-qr-sub">Direct APK & iOS Packages</small>
        </div>

      </div>

      {/* Minimal Footer Links */}
      <div className="landing-footer-bottom">
        <div className="landing-footer-brand">
          <span className="landing-brand-mark">
            <CustomBrainIcon size={14} />
          </span>
          <span className="landing-footer-name">Thenvue</span>
          <span className="landing-footer-tagline">· Your life, remembered for you.</span>
        </div>

        <div className="landing-footer-links">
          <button
            type="button"
            className="landing-footer-link-btn"
            onClick={() => setShowPrivacyModal(true)}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            className="landing-footer-link-btn"
            onClick={() => setShowPrivacyModal(true)}
          >
            Terms of Service
          </button>
          <a href="#features" className="landing-footer-link-btn">
            Changelog
          </a>
          <a href="mailto:support@thenvue.com" className="landing-footer-link-btn">
            Contact
          </a>
        </div>

        <div className="landing-footer-copyright" title="Hover for a message">
          <span className="copyright-primary">
            © {new Date().getFullYear()} Thenvue Inc. All rights reserved.
          </span>
          <span className="copyright-secret">
            © {new Date().getFullYear()} Thenvue Inc. (And no, we still aren&apos;t selling your data.)
          </span>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <button
        type="button"
        className={`landing-back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll back to top"
      >
        <ArrowUp size={17} />
      </button>


      {/* Privacy Policy & Terms Modal */}
      {showPrivacyModal && (
        <div className="overlay" style={{ alignItems: 'center' }}>
          <div className="detail-modal" style={{ maxWidth: 580, maxHeight: '85vh' }}>
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

            <article style={{ marginTop: 24, fontSize: 14, lineHeight: 1.6 }}>
              <h2 style={{ font: '22px Georgia, serif', margin: '0 0 10px' }}>
                Your memories are private property.
              </h2>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 16 }}>
                Thenvue was built from day one on the principle that personal memories and daily
                reflections should never be commercialized, harvested for ad networks, or exposed to
                third parties.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                <div className="bento-privacy-item">
                  <strong style={{ display: 'block', color: 'var(--foreground)' }}>
                    1. Isolated Row Level Security
                  </strong>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                    Every memory, photo, and voice audio asset is strictly tied to your authenticated
                    user UUID and guarded by database-level policies.
                  </span>
                </div>

                <div className="bento-privacy-item">
                  <strong style={{ display: 'block', color: 'var(--foreground)' }}>
                    2. Private AI Inference
                  </strong>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                    Conversational Ask searches reflect solely on the memories retrieved from your
                    personal account and are never stored or used to train public models.
                  </span>
                </div>

                <div className="bento-privacy-item">
                  <strong style={{ display: 'block', color: 'var(--foreground)' }}>
                    3. Full Data Portability
                  </strong>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                    You own 100% of your data. You may export or purge all your memories at any time.
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 28, textAlign: 'right' }}>
                <button
                  type="button"
                  className="save-memory"
                  style={{ width: 'auto', padding: '10px 24px' }}
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
