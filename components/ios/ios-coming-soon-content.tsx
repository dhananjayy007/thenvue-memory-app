'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Smartphone,
  Shield,
  Mic,
  CheckCircle2,
  ArrowRight,
  Download,
  Globe,
  Bell,
  AlertCircle,
  Compass,
  PlusSquare,
  Check,
} from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'
import { joinWaitlistAction } from '@/app/actions/waitlist'

export function IosComingSoonContent() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIosSafari, setIsIosSafari] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ua = window.navigator.userAgent
    const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua)
    setIsIosSafari(isIos && isSafari)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setLoading(true)
    setError(null)

    try {
      const res = await joinWaitlistAction({ email, platform: 'ios' })
      if (res.success) {
        setSubmitted(true)
      } else {
        setError(res.error || 'Unable to join waitlist. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ios-page-wrapper">
      {/* Background ambient lighting */}
      <div className="ios-bg-glow" />
      <div className="ios-bg-glow-secondary" />

      {/* Top Navigation */}
      <header className="ios-nav">
        <Link href="/" className="ios-back-btn">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <div className="ios-nav-brand">
          <ThenvueLogo size={24} />
          <span className="ios-brand-title">Thenvue</span>
        </div>
        <Link href="/login" className="ios-nav-login">
          <span>Open Web App</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="ios-main-content">
        {/* Apple Pill Badge */}
        <div className="ios-pill-badge">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
            fill="currentColor"
            width="14"
            height="14"
          >
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          <span>iOS Experience</span>
          <span className="ios-pill-dot" />
          <span className="ios-pill-highlight">Coming Soon</span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="ios-hero-title">
          Thenvue for iPhone & iPad is almost here.
        </h1>
        <p className="ios-hero-sub">
          We are polishing our native iOS app with fluid navigation, date-based photo rediscovery, and voice memory reflections.
        </p>

        {/* Early Access / Waitlist Form */}
        <div className="ios-waitlist-card">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="ios-waitlist-form">
              <div className="ios-form-header">
                <Bell size={18} className="ios-form-icon" />
                <div>
                  <h3 className="ios-form-title">Get Early TestFlight Access</h3>
                  <p className="ios-form-desc">Be notified when our iOS beta builds are ready for testing.</p>
                </div>
              </div>
              <div className="ios-input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="ios-input"
                />
                <button type="submit" disabled={loading} className="ios-submit-btn">
                  {loading ? 'Subscribing...' : 'Notify Me'}
                  <ArrowRight size={15} />
                </button>
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: 12 }}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
              <span className="ios-spam-note">No spam. Only early TestFlight invitations & launch updates.</span>
            </form>
          ) : (
            <div className="ios-success-state">
              <CheckCircle2 size={36} className="ios-success-icon" />
              <h3 className="ios-success-title">You&apos;re on the list!</h3>
              <p className="ios-success-desc">
                We&apos;ll email <strong style={{ color: 'var(--landing-teal, #5C948C)' }}>{email}</strong> with a TestFlight notification as soon as early access opens.
              </p>
            </div>
          )}
        </div>

        {/* PWA Home Screen Guide - Available Today */}
        <section className="ios-pwa-section" aria-labelledby="pwa-install-title">
          <div className="ios-pwa-header">
            <span className="ios-pwa-tag">
              <Sparkles size={12} />
              <span>Available Today · No Waitlist Needed</span>
            </span>
            <h2 id="pwa-install-title" className="ios-pwa-title">Use it like an app today</h2>
            <p className="ios-pwa-sub">
              You don&apos;t have to wait for TestFlight. Add Thenvue directly to your iPhone or iPad home screen from Safari:
            </p>
          </div>

          {isIosSafari === false && (
            <div className="ios-browser-notice">
              <Compass size={15} className="ios-notice-icon" />
              <span>
                <strong>Safari on iOS required:</strong> If you are viewing this on desktop or another browser (like Chrome), open <strong>thenvue.com</strong> in <strong>Safari</strong> on your iPhone or iPad to add it.
              </span>
            </div>
          )}

          <div className="ios-steps-grid">
            {/* Step 1 */}
            <div className="ios-step-card">
              <div className="ios-step-badge">1</div>
              <div className="ios-step-body">
                <div className="ios-step-title-row">
                  <Compass size={16} className="ios-step-icon" />
                  <h4>Open in Safari</h4>
                </div>
                <p>
                  Visit <span className="ios-step-domain">thenvue.com</span> in <strong>Safari</strong> on your iPhone or iPad.
                </p>
                <small className="ios-step-requirement">Must be Safari specifically — Chrome for iOS cannot add home screen apps.</small>
              </div>
            </div>

            {/* Step 2 */}
            <div className="ios-step-card">
              <div className="ios-step-badge">2</div>
              <div className="ios-step-body">
                <div className="ios-step-title-row">
                  <div className="ios-share-glyph-badge" title="iOS Share icon">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </div>
                  <h4>Tap the Share icon</h4>
                </div>
                <p>
                  In the bottom toolbar of Safari, tap the <strong>Share</strong> icon (the square with an arrow pointing upward).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="ios-step-card">
              <div className="ios-step-badge">3</div>
              <div className="ios-step-body">
                <div className="ios-step-title-row">
                  <PlusSquare size={16} className="ios-step-icon" />
                  <h4>Tap &ldquo;Add to Home Screen&rdquo;</h4>
                </div>
                <p>
                  Scroll down the share menu and tap <strong>Add to Home Screen</strong> (look for the square icon with a plus sign).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="ios-step-card">
              <div className="ios-step-badge">4</div>
              <div className="ios-step-body">
                <div className="ios-step-title-row">
                  <Check size={16} className="ios-step-icon" />
                  <h4>Tap &ldquo;Add&rdquo;</h4>
                </div>
                <p>
                  Tap <strong>Add</strong> in the top-right corner. Thenvue will appear on your home screen with its custom icon and launch full-screen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <div className="ios-features-grid">
          <div className="ios-feature-card">
            <div className="ios-feat-icon-wrap">
              <Smartphone size={20} />
            </div>
            <h4 className="ios-feat-title">Fluid iOS Experience</h4>
            <p className="ios-feat-text">Designed with calm aesthetics, dark mode by default, and smooth swipe navigation.</p>
          </div>

          <div className="ios-feature-card">
            <div className="ios-feat-icon-wrap">
              <Sparkles size={20} />
            </div>
            <h4 className="ios-feat-title">Rediscover Past Moments</h4>
            <p className="ios-feat-text">Date extraction keeps every historical memory accurately organized on your timeline.</p>
          </div>

          <div className="ios-feature-card">
            <div className="ios-feat-icon-wrap">
              <Mic size={20} />
            </div>
            <h4 className="ios-feat-title">Voice Reflections</h4>
            <p className="ios-feat-text">Speak freely — Thenvue transcribes and organizes your spoken reflections.</p>
          </div>

          <div className="ios-feature-card">
            <div className="ios-feat-icon-wrap">
              <Shield size={20} />
            </div>
            <h4 className="ios-feat-title">Account Isolation</h4>
            <p className="ios-feat-text">Your private memories stay strictly yours with row-level database security.</p>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="ios-actions-section">
          <h3 className="ios-actions-heading">Experience Thenvue Today</h3>
          <div className="ios-actions-row">
            <Link href="/login" className="ios-action-button primary">
              <Globe size={18} />
              <div className="android-action-text">
                <span className="ios-action-sub">Available Now</span>
                <span className="ios-action-main">Use Thenvue in Browser</span>
              </div>
            </Link>

            <Link href="/android" className="ios-action-button secondary">
              <Smartphone size={18} />
              <div className="android-action-text">
                <span className="ios-action-sub">Android Edition</span>
                <span className="ios-action-main">Android Waitlist (Coming Soon)</span>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="ios-footer">
        <p>© {new Date().getFullYear()} Thenvue. All rights reserved.</p>
      </footer>

      {/* Styles */}
      <style jsx>{`
        .ios-page-wrapper {
          min-height: 100vh;
          background: var(--background, #1C1815);
          color: var(--foreground, #EAE1CC);
          position: relative;
          overflow-x: hidden;
          font-family: var(--font-work-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .ios-bg-glow {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 450px;
          background: radial-gradient(circle, rgba(92, 148, 140, 0.12) 0%, rgba(92, 148, 140, 0.03) 50%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .ios-bg-glow-secondary {
          position: absolute;
          bottom: 0;
          right: 10%;
          width: 500px;
          height: 350px;
          background: radial-gradient(circle, rgba(92, 148, 140, 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .ios-nav {
          position: relative;
          z-index: 10;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          padding: 24px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ios-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--muted-foreground, #B0A594);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .ios-back-btn:hover {
          color: var(--foreground, #EAE1CC);
        }

        .ios-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ios-logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ios-brand-title {
          font-weight: 600;
          font-size: 17px;
          letter-spacing: -0.02em;
          color: var(--foreground, #EAE1CC);
        }

        .ios-nav-login {
          font-size: 13px;
          color: var(--landing-teal, #5C948C);
          border: 1px solid rgba(92, 148, 140, 0.35);
          padding: 6px 14px;
          border-radius: 20px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .ios-nav-login:hover {
          background: rgba(92, 148, 140, 0.12);
          border-color: var(--landing-teal, #5C948C);
        }

        .ios-main-content {
          position: relative;
          z-index: 1;
          max-width: 820px;
          margin: 0 auto;
          width: 100%;
          padding: 40px 24px 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
        }

        .ios-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(234, 225, 204, 0.04);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.12));
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          color: var(--muted-foreground, #B0A594);
          margin-bottom: 24px;
        }

        .ios-pill-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--landing-teal, #5C948C);
          opacity: 0.7;
        }

        .ios-pill-highlight {
          color: var(--landing-teal, #5C948C);
          font-weight: 600;
        }

        .ios-hero-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: clamp(34px, 4.8vw, 44px);
          line-height: 1.15;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
          color: var(--foreground, #EAE1CC);
        }

        .ios-hero-sub {
          font-size: 17px;
          line-height: 1.55;
          color: var(--muted-foreground, #B0A594);
          max-width: 620px;
          margin: 0 0 36px 0;
        }

        .ios-waitlist-card {
          width: 100%;
          max-width: 560px;
          background: var(--card, #262019);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.12));
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          margin-bottom: 50px;
          text-align: left;
        }

        .ios-form-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }

        .ios-form-icon {
          color: var(--landing-teal, #5C948C);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .ios-form-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 4px 0;
        }

        .ios-form-desc {
          font-size: 13px;
          color: var(--muted-foreground, #B0A594);
          margin: 0;
        }

        .ios-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .ios-input {
          flex: 1;
          background: rgba(234, 225, 204, 0.04);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.12));
          border-radius: 12px;
          padding: 12px 16px;
          color: var(--foreground, #EAE1CC);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .ios-input:focus {
          border-color: var(--landing-teal, #5C948C);
        }

        .ios-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--landing-teal, #5C948C);
          color: #1C1815;
          font-weight: 600;
          font-size: 14px;
          border: none;
          border-radius: 12px;
          padding: 0 20px;
          cursor: pointer;
          transition: opacity 0.2s ease, filter 0.2s ease;
          white-space: nowrap;
        }
        .ios-submit-btn:hover {
          filter: brightness(1.08);
          opacity: 0.95;
        }

        .ios-spam-note {
          font-size: 11px;
          color: var(--muted-foreground, #B0A594);
          opacity: 0.8;
        }

        .ios-success-state {
          text-align: center;
          padding: 12px 0;
        }

        .ios-success-icon {
          color: var(--landing-teal, #5C948C);
          margin: 0 auto 12px auto;
        }

        .ios-success-title {
          font-size: 19px;
          font-weight: 600;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 8px 0;
        }

        .ios-success-desc {
          font-size: 14px;
          line-height: 1.5;
          color: var(--muted-foreground, #B0A594);
          margin: 0;
        }

        .ios-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 740px;
          margin-bottom: 50px;
          text-align: left;
        }

        .ios-feature-card {
          background: var(--card, #262019);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.08));
          border-radius: 16px;
          padding: 20px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .ios-feature-card:hover {
          transform: translateY(-2px);
          border-color: rgba(92, 148, 140, 0.35);
        }

        .ios-feat-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(92, 148, 140, 0.12);
          color: var(--landing-teal, #5C948C);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .ios-feat-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 6px 0;
        }

        .ios-feat-text {
          font-size: 13px;
          line-height: 1.45;
          color: var(--muted-foreground, #B0A594);
          margin: 0;
        }

        .ios-actions-section {
          width: 100%;
          max-width: 580px;
          text-align: center;
        }

        .ios-actions-heading {
          font-size: 18px;
          font-weight: 600;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 16px 0;
        }

        .ios-actions-row {
          display: flex;
          gap: 14px;
        }

        .ios-action-button {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 14px;
          text-decoration: none;
          text-align: left;
          transition: all 0.2s ease;
        }

        .ios-action-button.primary {
          background: var(--card, #262019);
          border: 1px solid rgba(92, 148, 140, 0.35);
          color: var(--foreground, #EAE1CC);
        }
        .ios-action-button.primary:hover {
          background: rgba(92, 148, 140, 0.08);
          border-color: var(--landing-teal, #5C948C);
        }

        .ios-action-button.secondary {
          background: transparent;
          border: 1px solid var(--border, rgba(234, 225, 204, 0.1));
          color: var(--muted-foreground, #B0A594);
        }
        .ios-action-button.secondary:hover {
          background: rgba(234, 225, 204, 0.04);
          border-color: rgba(234, 225, 204, 0.25);
          color: var(--foreground, #EAE1CC);
        }

        .ios-action-text {
          display: flex;
          flex-direction: column;
        }

        .ios-action-sub {
          font-size: 11px;
          color: var(--muted-foreground, #B0A594);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          opacity: 0.8;
        }

        .ios-action-main {
          font-size: 14px;
          font-weight: 600;
          color: inherit;
        }

        .ios-pwa-section {
          width: 100%;
          max-width: 760px;
          margin-bottom: 56px;
          text-align: left;
        }

        .ios-pwa-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .ios-pwa-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--landing-teal, #5C948C);
          background: rgba(92, 148, 140, 0.12);
          border: 1px solid rgba(92, 148, 140, 0.28);
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 12px;
        }

        .ios-pwa-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: clamp(24px, 3.2vw, 32px);
          font-weight: 400;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
        }

        .ios-pwa-sub {
          font-size: 15px;
          line-height: 1.55;
          color: var(--muted-foreground, #B0A594);
          max-width: 580px;
          margin: 0 auto;
        }

        .ios-browser-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(92, 148, 140, 0.08);
          border: 1px solid rgba(92, 148, 140, 0.24);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          color: var(--foreground, #EAE1CC);
          line-height: 1.45;
        }

        .ios-notice-icon {
          color: var(--landing-teal, #5C948C);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ios-steps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .ios-step-card {
          background: var(--card, #262019);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.1));
          border-radius: 16px;
          padding: 20px 22px;
          display: flex;
          gap: 14px;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .ios-step-card:hover {
          border-color: rgba(92, 148, 140, 0.35);
          background: rgba(234, 225, 204, 0.04);
        }

        .ios-step-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(92, 148, 140, 0.15);
          color: var(--landing-teal, #5C948C);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
        }

        .ios-step-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .ios-step-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ios-step-title-row h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--foreground, #EAE1CC);
        }

        .ios-step-icon {
          color: var(--landing-teal, #5C948C);
        }

        .ios-share-glyph-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--landing-teal, #5C948C);
        }

        .ios-step-body p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--muted-foreground, #B0A594);
        }

        .ios-step-domain {
          background: rgba(234, 225, 204, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--landing-teal, #5C948C);
          font-family: monospace;
          font-size: 12px;
        }

        .ios-step-requirement {
          font-size: 11px;
          color: var(--muted-foreground, #B0A594);
          opacity: 0.85;
          font-style: italic;
          display: block;
          margin-top: 2px;
        }

        .ios-footer {
          text-align: center;
          padding: 24px;
          font-size: 12px;
          color: var(--muted-foreground, #B0A594);
          opacity: 0.8;
          border-top: 1px solid var(--border, rgba(234, 225, 204, 0.08));
        }

        @media (max-width: 640px) {
          .ios-hero-title {
            font-size: 32px;
          }
          .ios-steps-grid {
            grid-template-columns: 1fr;
          }
          .ios-features-grid {
            grid-template-columns: 1fr;
          }
          .ios-input-group {
            flex-direction: column;
          }
          .ios-submit-btn {
            padding: 12px;
            justify-content: center;
          }
          .ios-actions-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
