'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Share2,
  Smartphone,
  Sparkles,
  ArrowRight,
  Download,
  ExternalLink,
  Layers,
  Shield,
} from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'
import { joinWaitlistAction } from '@/app/actions/waitlist'
import { APP_INSTALL_CONFIG } from '@/lib/app-install-config'

export function InstallPageContent() {
  const [email, setEmail] = useState('')
  const [platform, setPlatform] = useState<'all' | 'ios' | 'android'>('all')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await joinWaitlistAction({ email, platform })
      if (res.success) {
        setSubmitted(true)
      } else {
        setError(res.error || 'Could not subscribe. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="install-page-container">
      {/* Background ambient lighting */}
      <div className="install-bg-glow" />
      <div className="install-bg-glow-secondary" />

      {/* Header */}
      <header className="install-header">
        <Link href="/app" className="install-back-btn" aria-label="Back to App">
          <ArrowLeft size={16} />
          <span>Back to App</span>
        </Link>
        <div className="install-brand">
          <ThenvueLogo size={22} />
          <span>Thenvue</span>
        </div>
        <Link href="/login" className="install-login-btn">
          <span>Sign In</span>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="install-main">
        <div className="install-hero">
          <div className="install-pill-badge">
            <Sparkles size={13} />
            <span>MOBILE EXPERIENCE</span>
          </div>

          <h1 className="install-title">Take your story with you everywhere.</h1>
          <p className="install-subtitle">
            Native iOS and Android apps are currently being crafted. Join the early access waitlist for beta releases, or install the web app to your home screen right now.
          </p>
        </div>

        {/* Platform Cards Section */}
        <div className="install-platforms-grid">
          {/* iOS Card */}
          <div className="install-platform-card">
            <div className="install-platform-header">
              <div className="install-platform-icon apple-icon">
                <svg viewBox="0 0 384 512" width="22" height="22" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
              </div>
              <span className="install-badge-pill">Coming Soon</span>
            </div>

            <h3>Thenvue for iOS</h3>
            <p>Designed for iPhone with haptics, native microphone recording, camera roll sync, and home screen widgets.</p>

            <div className="install-action-wrapper">
              <button
                type="button"
                className="install-cta-btn disabled-cta"
                onClick={() => setPlatform('ios')}
              >
                <span>TestFlight Beta Soon</span>
              </button>
            </div>
          </div>

          {/* Android Card */}
          <div className="install-platform-card">
            <div className="install-platform-header">
              <div className="install-platform-icon android-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8533 8.082 12 8.082s-3.5902.329-5.1368.8677L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.343 14.6589 0 18.761h24c-.343-4.1021-2.6889-7.5743-6.1185-9.4396" />
                </svg>
              </div>
              <span className="install-badge-pill">Coming Soon</span>
            </div>

            <h3>Thenvue for Android</h3>
            <p>Optimized for Android phones with instant lock screen capture, material dark palette, and audio waveforms.</p>

            <div className="install-action-wrapper">
              <button
                type="button"
                className="install-cta-btn disabled-cta"
                onClick={() => setPlatform('android')}
              >
                <span>Google Play Beta Soon</span>
              </button>
            </div>
          </div>
        </div>

        {/* Waitlist Capture Card */}
        <div className="install-waitlist-box">
          <div className="install-waitlist-header">
            <Bell size={20} className="install-waitlist-icon" />
            <div>
              <h3>Get Early Beta Access</h3>
              <p>Be the first to test our iOS TestFlight and Android releases before public launch.</p>
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="install-waitlist-form">
              <div className="install-platform-selector">
                <button
                  type="button"
                  className={platform === 'all' ? 'active' : ''}
                  onClick={() => setPlatform('all')}
                >
                  Both Platforms
                </button>
                <button
                  type="button"
                  className={platform === 'ios' ? 'active' : ''}
                  onClick={() => setPlatform('ios')}
                >
                  iOS
                </button>
                <button
                  type="button"
                  className={platform === 'android' ? 'active' : ''}
                  onClick={() => setPlatform('android')}
                >
                  Android
                </button>
              </div>

              <div className="install-input-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="install-email-input"
                />
                <button type="submit" disabled={loading} className="install-submit-btn">
                  <span>{loading ? 'Subscribing...' : 'Join Waitlist'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
              {error && <p className="auth-error" style={{ margin: '8px 0 0' }}>{error}</p>}
              <small className="install-privacy-note">
                No spam. We will only email you when early beta builds are ready for your device.
              </small>
            </form>
          ) : (
            <div className="install-success-card">
              <CheckCircle2 size={32} className="install-success-check" />
              <div>
                <h4>You&apos;re on the early access list!</h4>
                <p>We will email <strong>{email}</strong> as soon as beta invites open.</p>
              </div>
            </div>
          )}
        </div>

        {/* Instant Mobile Web / PWA Section */}
        <div className="install-pwa-section">
          <div className="install-pwa-content">
            <span className="install-eyebrow">USE IT RIGHT NOW</span>
            <h2>Add Thenvue to your home screen today</h2>
            <p>
              You don&apos;t need to wait for the app store. Thenvue is fully optimized as a mobile web app with offline caching and native touch gestures.
            </p>

            <div className="install-pwa-steps">
              <div className="install-step">
                <div className="step-number">1</div>
                <div>
                  <strong>Open on your phone</strong>
                  <p>Open <code>https://thenvue.com</code> in Safari (iOS) or Chrome (Android).</p>
                </div>
              </div>
              <div className="install-step">
                <div className="step-number">2</div>
                <div>
                  <strong>Tap Share or Menu</strong>
                  <p>In Safari tap the Share button <Share2 size={13} style={{ display: 'inline' }} />. In Chrome tap the three-dots menu.</p>
                </div>
              </div>
              <div className="install-step">
                <div className="step-number">3</div>
                <div>
                  <strong>Add to Home Screen</strong>
                  <p>Select &ldquo;Add to Home Screen&rdquo; to launch Thenvue as a standalone app.</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="install-qr-card">
            <div className="install-qr-box">
              {/* Scalable Vector QR Code linking to https://thenvue.com */}
              <svg
                viewBox="0 0 160 160"
                width="150"
                height="150"
                className="install-qr-svg"
                aria-label="Scan QR code to open Thenvue on mobile"
              >
                <rect width="160" height="160" fill="#ffffff" rx="10" />
                {/* Top-Left Position Marker */}
                <rect x="15" y="15" width="40" height="40" fill="#1C1E1D" rx="4" />
                <rect x="23" y="23" width="24" height="24" fill="#ffffff" rx="2" />
                <rect x="29" y="29" width="12" height="12" fill="#C97D57" rx="1" />
                {/* Top-Right Position Marker */}
                <rect x="105" y="15" width="40" height="40" fill="#1C1E1D" rx="4" />
                <rect x="113" y="23" width="24" height="24" fill="#ffffff" rx="2" />
                <rect x="119" y="29" width="12" height="12" fill="#C97D57" rx="1" />
                {/* Bottom-Left Position Marker */}
                <rect x="15" y="105" width="40" height="40" fill="#1C1E1D" rx="4" />
                <rect x="23" y="113" width="24" height="24" fill="#ffffff" rx="2" />
                <rect x="29" y="119" width="12" height="12" fill="#C97D57" rx="1" />
                {/* Decorative Data Nodes */}
                <rect x="65" y="20" width="8" height="8" fill="#1C1E1D" />
                <rect x="80" y="20" width="8" height="8" fill="#C97D57" />
                <rect x="65" y="35" width="8" height="8" fill="#C97D57" />
                <rect x="80" y="35" width="8" height="8" fill="#1C1E1D" />
                <rect x="65" y="50" width="8" height="8" fill="#1C1E1D" />
                <rect x="20" y="65" width="8" height="8" fill="#1C1E1D" />
                <rect x="35" y="65" width="8" height="8" fill="#C97D57" />
                <rect x="50" y="65" width="8" height="8" fill="#1C1E1D" />
                <rect x="65" y="65" width="8" height="8" fill="#1C1E1D" />
                <rect x="80" y="65" width="8" height="8" fill="#C97D57" />
                <rect x="95" y="65" width="8" height="8" fill="#1C1E1D" />
                <rect x="110" y="65" width="8" height="8" fill="#C97D57" />
                <rect x="125" y="65" width="8" height="8" fill="#1C1E1D" />
                <rect x="140" y="65" width="8" height="8" fill="#1C1E1D" />
                {/* Center Feather Icon */}
                <circle cx="80" cy="80" r="14" fill="#1C1E1D" />
                <circle cx="80" cy="80" r="10" fill="#5C948C" />
                {/* Bottom Data Nodes */}
                <rect x="65" y="95" width="8" height="8" fill="#1C1E1D" />
                <rect x="80" y="95" width="8" height="8" fill="#C97D57" />
                <rect x="95" y="95" width="8" height="8" fill="#1C1E1D" />
                <rect x="110" y="95" width="8" height="8" fill="#1C1E1D" />
                <rect x="65" y="110" width="8" height="8" fill="#C97D57" />
                <rect x="80" y="110" width="8" height="8" fill="#1C1E1D" />
                <rect x="95" y="110" width="8" height="8" fill="#1C1E1D" />
                <rect x="125" y="110" width="8" height="8" fill="#C97D57" />
                <rect x="65" y="125" width="8" height="8" fill="#1C1E1D" />
                <rect x="80" y="125" width="8" height="8" fill="#C97D57" />
                <rect x="110" y="125" width="8" height="8" fill="#1C1E1D" />
                <rect x="125" y="125" width="8" height="8" fill="#1C1E1D" />
                <rect x="140" y="125" width="8" height="8" fill="#1C1E1D" />
                <rect x="65" y="140" width="8" height="8" fill="#C97D57" />
                <rect x="95" y="140" width="8" height="8" fill="#1C1E1D" />
                <rect x="125" y="140" width="8" height="8" fill="#1C1E1D" />
              </svg>
            </div>
            <span className="install-qr-caption">Scan with your phone camera</span>
          </div>
        </div>
      </main>
    </div>
  )
}
