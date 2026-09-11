'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Smartphone,
  Shield,
  Mic,
  CheckCircle2,
  ArrowRight,
  Globe,
  Bell,
  AlertCircle,
  MoreVertical,
  PlusSquare,
} from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'
import { joinWaitlistAction } from '@/app/actions/waitlist'

export function AndroidComingSoonContent() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setLoading(true)
    setError(null)

    try {
      const res = await joinWaitlistAction({ email, platform: 'android' })
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
    <div className="android-page-wrapper">
      {/* Background ambient lighting */}
      <div className="android-bg-glow" />
      <div className="android-bg-glow-secondary" />

      {/* Top Navigation */}
      <header className="android-nav">
        <Link href="/" className="android-back-btn">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <div className="android-nav-brand">
          <ThenvueLogo size={24} />
          <span className="android-brand-title">Thenvue</span>
        </div>
        <Link href="/login" className="android-nav-login">
          <span>Open Web App</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="android-main-content">
        {/* Android Pill Badge */}
        <div className="android-pill-badge">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="currentColor"
          >
            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.156-.2702.0633-.6153-.2069-.7713-.2706-.1564-.6154-.0637-.7714.2069l-2.0231 3.5041c-1.5039-.6873-3.1904-1.0706-4.9921-1.0706-1.8016 0-3.4882.3833-4.9921 1.0706L4.869 5.304c-.156-.2706-.5008-.3633-.7714-.2069-.2702.156-.3629.5011-.2069.7713l1.996 3.4572C2.668 11.0708 1 14.3414 1 18.0683h22c0-3.7269-1.668-6.9975-4.1185-8.7469" />
          </svg>
          <span>Android Experience</span>
          <span className="android-pill-dot" />
          <span className="android-pill-highlight">Coming Soon</span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="android-hero-title">
          Thenvue for Android is almost here.
        </h1>
        <p className="android-hero-sub">
          We are polishing our native Android app with fluid navigation, date-based photo rediscovery, and voice memory reflections.
        </p>

        {/* Early Access / Waitlist Form */}
        <div className="android-waitlist-card">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="android-waitlist-form">
              <div className="android-form-header">
                <Bell size={18} className="android-form-icon" />
                <div>
                  <h3 className="android-form-title">Get Early Google Play Access</h3>
                  <p className="android-form-desc">Be notified when our Android beta builds are ready for testing.</p>
                </div>
              </div>
              <div className="android-input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="android-input"
                />
                <button type="submit" disabled={loading} className="android-submit-btn">
                  {loading ? 'Subscribing...' : 'Notify Me'}
                  <ArrowRight size={15} />
                </button>
              </div>
              {error && (
                <div className="android-error-msg">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
              <span className="android-spam-note">No spam. Only early beta invitations & launch updates.</span>
            </form>
          ) : (
            <div className="android-success-state">
              <CheckCircle2 size={36} className="android-success-icon" />
              <h3 className="android-success-title">You&apos;re on the list!</h3>
              <p className="android-success-desc">
                We&apos;ll email <strong style={{ color: 'var(--landing-teal, #5C948C)' }}>{email}</strong> with early access instructions as soon as the Android beta opens.
              </p>
            </div>
          )}
        </div>

        {/* PWA Home Screen Guide - Available Today */}
        <section className="android-pwa-section" aria-labelledby="android-pwa-title">
          <div className="android-pwa-card">
            <div className="android-pwa-header">
              <span className="android-pwa-tag">
                <Sparkles size={12} />
                <span>Available Today · No Waitlist Needed</span>
              </span>
              <h2 id="android-pwa-title" className="android-pwa-title">Use it like an app today</h2>
              <p className="android-pwa-sub">
                Want to start journaling now? You don&apos;t have to wait for the Google Play release. You can install Thenvue directly to your Android device using Chrome:
              </p>
            </div>

            <div className="android-steps-row">
              <div className="android-step-item">
                <div className="android-step-num">1</div>
                <div className="android-step-content">
                  <div className="android-step-label">
                    <Globe size={15} className="android-step-icon" />
                    <strong>Open in Chrome</strong>
                  </div>
                  <p>Visit <span className="android-step-domain">thenvue.com</span> in Chrome on your phone.</p>
                </div>
              </div>

              <div className="android-step-item">
                <div className="android-step-num">2</div>
                <div className="android-step-content">
                  <div className="android-step-label">
                    <MoreVertical size={15} className="android-step-icon" />
                    <strong>Tap the menu (⋮)</strong>
                  </div>
                  <p>Tap the three vertical dots in the top-right corner of Chrome.</p>
                </div>
              </div>

              <div className="android-step-item">
                <div className="android-step-num">3</div>
                <div className="android-step-content">
                  <div className="android-step-label">
                    <PlusSquare size={15} className="android-step-icon" />
                    <strong>Add to Home screen</strong>
                  </div>
                  <p>Select &ldquo;Add to Home screen&rdquo; or &ldquo;Install app&rdquo;, then tap Install.</p>
                </div>
              </div>
            </div>

            <div className="android-pwa-footer">
              <span className="android-pwa-hint">
                Thenvue installs as a standalone app with its custom icon and launches full-screen without browser URL bars.
              </span>
              <Link href="/login" className="android-pwa-launch-btn">
                <span>Launch in Browser</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <div className="android-features-grid">
          <div className="android-feature-card">
            <div className="android-feat-icon-wrap">
              <Smartphone size={20} />
            </div>
            <h4 className="android-feat-title">Fluid Android Experience</h4>
            <p className="android-feat-text">Designed with calm aesthetics, warm dark mode by default, and smooth navigation.</p>
          </div>

          <div className="android-feature-card">
            <div className="android-feat-icon-wrap">
              <Sparkles size={20} />
            </div>
            <h4 className="android-feat-title">Rediscover Past Moments</h4>
            <p className="android-feat-text">Date extraction keeps every historical memory accurately organized on your timeline.</p>
          </div>

          <div className="android-feature-card">
            <div className="android-feat-icon-wrap">
              <Mic size={20} />
            </div>
            <h4 className="android-feat-title">Voice Reflections</h4>
            <p className="android-feat-text">Speak freely — Thenvue transcribes and organizes your spoken reflections.</p>
          </div>

          <div className="android-feature-card">
            <div className="android-feat-icon-wrap">
              <Shield size={20} />
            </div>
            <h4 className="android-feat-title">Account Isolation</h4>
            <p className="android-feat-text">Your private memories stay strictly yours with row-level database security.</p>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="android-actions-section">
          <h3 className="android-actions-heading">Experience Thenvue Today</h3>
          <div className="android-actions-row">
            <Link href="/login" className="android-action-button primary">
              <Globe size={18} />
              <div className="android-action-text">
                <span className="android-action-sub">Available Now</span>
                <span className="android-action-main">Use Thenvue in Browser</span>
              </div>
            </Link>

            <Link href="/ios" className="android-action-button secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                fill="currentColor"
                width="16"
                height="16"
              >
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              <div className="android-action-text">
                <span className="android-action-sub">Apple Edition</span>
                <span className="android-action-main">iOS Waitlist (Coming Soon)</span>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="android-footer">
        <p>© {new Date().getFullYear()} Thenvue. All rights reserved.</p>
      </footer>

      {/* Styles */}
      <style jsx>{`
        .android-page-wrapper {
          min-height: 100vh;
          background: var(--background, #1C1815);
          color: var(--foreground, #EAE1CC);
          position: relative;
          overflow-x: hidden;
          font-family: var(--font-work-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .android-bg-glow {
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

        .android-bg-glow-secondary {
          position: absolute;
          bottom: 0;
          left: 10%;
          width: 500px;
          height: 350px;
          background: radial-gradient(circle, rgba(92, 148, 140, 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .android-nav {
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

        .android-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--muted-foreground, #B0A594);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .android-back-btn:hover {
          color: var(--foreground, #EAE1CC);
        }

        .android-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .android-logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .android-brand-title {
          font-weight: 600;
          font-size: 17px;
          letter-spacing: -0.02em;
          color: var(--foreground, #EAE1CC);
        }

        .android-nav-login {
          font-size: 13px;
          color: var(--landing-teal, #5C948C);
          border: 1px solid rgba(92, 148, 140, 0.35);
          padding: 6px 14px;
          border-radius: 20px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .android-nav-login:hover {
          background: rgba(92, 148, 140, 0.12);
          border-color: var(--landing-teal, #5C948C);
        }

        .android-main-content {
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

        .android-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 30px;
          background: rgba(234, 225, 204, 0.04);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.12));
          font-size: 13px;
          color: var(--muted-foreground, #B0A594);
          margin-bottom: 24px;
        }

        .android-pill-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--landing-teal, #5C948C);
          opacity: 0.7;
        }

        .android-pill-highlight {
          color: var(--landing-teal, #5C948C);
          font-weight: 600;
        }

        .android-hero-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: clamp(34px, 5vw, 48px);
          font-weight: 400;
          line-height: 1.18;
          letter-spacing: -0.02em;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 16px 0;
          max-width: 680px;
        }

        .android-hero-sub {
          font-size: clamp(16px, 2.2vw, 18px);
          line-height: 1.6;
          color: var(--muted-foreground, #B0A594);
          max-width: 620px;
          margin: 0 0 44px 0;
        }

        .android-waitlist-card {
          width: 100%;
          max-width: 540px;
          background: var(--card, #262019);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.12));
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          margin-bottom: 56px;
        }

        .android-waitlist-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }

        .android-form-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .android-form-icon {
          color: var(--landing-teal, #5C948C);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .android-form-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 4px 0;
        }

        .android-form-desc {
          font-size: 13px;
          color: var(--muted-foreground, #B0A594);
          margin: 0;
          line-height: 1.4;
        }

        .android-input-group {
          display: flex;
          gap: 8px;
        }

        .android-input {
          flex: 1;
          background: rgba(234, 225, 204, 0.04);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.12));
          border-radius: 10px;
          padding: 12px 16px;
          color: var(--foreground, #EAE1CC);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .android-input:focus {
          border-color: var(--landing-teal, #5C948C);
        }

        .android-submit-btn {
          background: var(--landing-teal, #5C948C);
          color: #1C1815;
          border: none;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .android-submit-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .android-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .android-error-msg {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #f87171;
          font-size: 12px;
        }

        .android-spam-note {
          font-size: 12px;
          color: var(--muted-foreground, #B0A594);
          opacity: 0.8;
          text-align: center;
        }

        .android-success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
        }

        .android-success-icon {
          color: var(--landing-teal, #5C948C);
        }

        .android-success-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--foreground, #EAE1CC);
          margin: 0;
        }

        .android-success-desc {
          font-size: 14px;
          color: var(--muted-foreground, #B0A594);
          margin: 0;
          line-height: 1.5;
        }

        .android-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 760px;
          margin-bottom: 60px;
        }

        .android-feature-card {
          background: var(--card, #262019);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.08));
          border-radius: 16px;
          padding: 24px;
          text-align: left;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .android-feature-card:hover {
          transform: translateY(-2px);
          border-color: rgba(92, 148, 140, 0.35);
        }

        .android-feat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(92, 148, 140, 0.12);
          color: var(--landing-teal, #5C948C);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .android-feat-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 8px 0;
        }

        .android-feat-text {
          font-size: 13px;
          line-height: 1.5;
          color: var(--muted-foreground, #B0A594);
          margin: 0;
        }

        .android-actions-section {
          width: 100%;
          max-width: 600px;
        }

        .android-actions-heading {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted-foreground, #B0A594);
          opacity: 0.8;
          margin: 0 0 20px 0;
        }

        .android-actions-row {
          display: flex;
          gap: 14px;
          justify-content: center;
        }

        .android-action-button {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 14px;
          text-decoration: none;
          text-align: left;
          transition: all 0.2s ease;
        }

        .android-action-button.primary {
          background: var(--card, #262019);
          border: 1px solid rgba(92, 148, 140, 0.35);
          color: var(--foreground, #EAE1CC);
        }
        .android-action-button.primary:hover {
          border-color: var(--landing-teal, #5C948C);
          background: rgba(92, 148, 140, 0.08);
        }

        .android-action-button.secondary {
          background: transparent;
          border: 1px solid var(--border, rgba(234, 225, 204, 0.1));
          color: var(--muted-foreground, #B0A594);
        }
        .android-action-button.secondary:hover {
          border-color: rgba(234, 225, 204, 0.25);
          color: var(--foreground, #EAE1CC);
        }

        .android-action-text {
          display: flex;
          flex-direction: column;
        }

        .android-action-sub {
          font-size: 11px;
          color: var(--muted-foreground, #B0A594);
          opacity: 0.8;
        }

        .android-action-main {
          font-size: 14px;
          font-weight: 500;
        }

        .android-footer {
          margin-top: auto;
          padding: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--muted-foreground, #B0A594);
          opacity: 0.8;
          border-top: 1px solid var(--border, rgba(234, 225, 204, 0.08));
        }

        .android-pwa-section {
          width: 100%;
          max-width: 680px;
          margin-bottom: 56px;
        }

        .android-pwa-card {
          background: var(--card, #262019);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.12));
          border-radius: 20px;
          padding: 28px 30px;
          text-align: left;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.3);
        }

        .android-pwa-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .android-pwa-tag {
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

        .android-pwa-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 400;
          color: var(--foreground, #EAE1CC);
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
        }

        .android-pwa-sub {
          font-size: 14px;
          line-height: 1.55;
          color: var(--muted-foreground, #B0A594);
          max-width: 520px;
          margin: 0 auto;
        }

        .android-steps-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 22px;
        }

        .android-step-item {
          background: rgba(234, 225, 204, 0.03);
          border: 1px solid var(--border, rgba(234, 225, 204, 0.08));
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .android-step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(92, 148, 140, 0.15);
          color: var(--landing-teal, #5C948C);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }

        .android-step-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .android-step-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--foreground, #EAE1CC);
        }

        .android-step-icon {
          color: var(--landing-teal, #5C948C);
          flex-shrink: 0;
        }

        .android-step-content p {
          margin: 0;
          font-size: 12px;
          line-height: 1.45;
          color: var(--muted-foreground, #B0A594);
        }

        .android-step-domain {
          background: rgba(234, 225, 204, 0.06);
          padding: 1px 5px;
          border-radius: 4px;
          color: var(--landing-teal, #5C948C);
          font-family: monospace;
          font-size: 11px;
        }

        .android-pwa-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border, rgba(234, 225, 204, 0.08));
        }

        .android-pwa-hint {
          font-size: 12px;
          color: var(--muted-foreground, #B0A594);
          opacity: 0.8;
          line-height: 1.4;
          flex: 1;
        }

        .android-pwa-launch-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--landing-teal, #5C948C);
          border: 1px solid rgba(92, 148, 140, 0.35);
          background: rgba(92, 148, 140, 0.08);
          padding: 8px 16px;
          border-radius: 10px;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .android-pwa-launch-btn:hover {
          background: rgba(92, 148, 140, 0.16);
          border-color: var(--landing-teal, #5C948C);
          color: var(--foreground, #EAE1CC);
        }

        @media (max-width: 640px) {
          .android-steps-row {
            grid-template-columns: 1fr;
          }
          .android-pwa-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          .android-pwa-card {
            padding: 20px 18px;
          }
          .android-features-grid {
            grid-template-columns: 1fr;
          }
          .android-input-group {
            flex-direction: column;
          }
          .android-actions-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
