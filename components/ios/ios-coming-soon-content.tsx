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
  Download,
  Globe,
  Bell,
} from 'lucide-react'

export function IosComingSoonContent() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 600)
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
          <div className="ios-logo-mark">
            <svg width="24" height="24" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="nav-feather" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E3A07C" />
                  <stop offset="100%" stopColor="#C97D57" />
                </linearGradient>
              </defs>
              <circle cx="512" cy="512" r="352" fill="none" stroke="url(#nav-feather)" strokeWidth="40"/>
              <g transform="translate(512,512)">
                <path d="M -150,150 C -170,60 -140,-70 -20,-190 C 40,-250 120,-260 150,-250 C 160,-210 150,-130 90,-60 C 40,-2 -30,40 -70,90 C -90,115 -110,140 -150,150 Z" fill="url(#nav-feather)"/>
              </g>
            </svg>
          </div>
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
              <span className="ios-spam-note">No spam. Only early TestFlight invitations & launch updates.</span>
            </form>
          ) : (
            <div className="ios-success-state">
              <CheckCircle2 size={36} className="ios-success-icon" />
              <h3 className="ios-success-title">You&apos;re on the list!</h3>
              <p className="ios-success-desc">
                We&apos;ll email <strong style={{ color: '#E3A07C' }}>{email}</strong> with a TestFlight notification as soon as early access opens.
              </p>
            </div>
          )}
        </div>

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
              <Download size={18} />
              <div className="android-action-text">
                <span className="ios-action-sub">Android Build</span>
                <span className="ios-action-main">Download Android APK</span>
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
          background: #141514;
          color: #F5F4F0;
          position: relative;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
          background: radial-gradient(circle, rgba(227, 160, 124, 0.12) 0%, rgba(201, 125, 87, 0.04) 50%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .ios-bg-glow-secondary {
          position: absolute;
          bottom: 0;
          right: 10%;
          width: 500px;
          height: 350px;
          background: radial-gradient(circle, rgba(227, 160, 124, 0.06) 0%, transparent 70%);
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
          color: #A1A09B;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .ios-back-btn:hover {
          color: #F5F4F0;
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
          color: #F5F4F0;
        }

        .ios-nav-login {
          font-size: 13px;
          color: #E3A07C;
          border: 1px solid rgba(227, 160, 124, 0.3);
          padding: 6px 14px;
          border-radius: 20px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .ios-nav-login:hover {
          background: rgba(227, 160, 124, 0.1);
          border-color: rgba(227, 160, 124, 0.6);
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
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          color: #D2D1CB;
          margin-bottom: 24px;
        }

        .ios-pill-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #A1A09B;
        }

        .ios-pill-highlight {
          color: #E3A07C;
          font-weight: 600;
        }

        .ios-hero-title {
          font-size: 42px;
          line-height: 1.15;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0 0 16px 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #D2D1CB 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .ios-hero-sub {
          font-size: 17px;
          line-height: 1.55;
          color: #A1A09B;
          max-width: 620px;
          margin: 0 0 36px 0;
        }

        .ios-waitlist-card {
          width: 100%;
          max-width: 560px;
          background: #1A1C1B;
          border: 1px solid rgba(255, 255, 255, 0.1);
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
          color: #E3A07C;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .ios-form-title {
          font-size: 16px;
          font-weight: 600;
          color: #F5F4F0;
          margin: 0 0 4px 0;
        }

        .ios-form-desc {
          font-size: 13px;
          color: #8E8D88;
          margin: 0;
        }

        .ios-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .ios-input {
          flex: 1;
          background: #232523;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 12px 16px;
          color: #F5F4F0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .ios-input:focus {
          border-color: #E3A07C;
        }

        .ios-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #E3A07C 0%, #C97D57 100%);
          color: #141514;
          font-weight: 600;
          font-size: 14px;
          border: none;
          border-radius: 12px;
          padding: 0 20px;
          cursor: pointer;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }
        .ios-submit-btn:hover {
          opacity: 0.92;
        }

        .ios-spam-note {
          font-size: 11px;
          color: #71706C;
        }

        .ios-success-state {
          text-align: center;
          padding: 12px 0;
        }

        .ios-success-icon {
          color: #4ade80;
          margin: 0 auto 12px auto;
        }

        .ios-success-title {
          font-size: 19px;
          font-weight: 600;
          color: #F5F4F0;
          margin: 0 0 8px 0;
        }

        .ios-success-desc {
          font-size: 14px;
          line-height: 1.5;
          color: #A1A09B;
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
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .ios-feature-card:hover {
          transform: translateY(-2px);
          border-color: rgba(227, 160, 124, 0.25);
        }

        .ios-feat-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(227, 160, 124, 0.12);
          color: #E3A07C;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .ios-feat-title {
          font-size: 15px;
          font-weight: 600;
          color: #F5F4F0;
          margin: 0 0 6px 0;
        }

        .ios-feat-text {
          font-size: 13px;
          line-height: 1.45;
          color: #8E8D88;
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
          color: #D2D1CB;
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
          background: #232523;
          border: 1px solid rgba(227, 160, 124, 0.35);
          color: #F5F4F0;
        }
        .ios-action-button.primary:hover {
          background: #2b2e2b;
          border-color: #E3A07C;
        }

        .ios-action-button.secondary {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #D2D1CB;
        }
        .ios-action-button.secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #F5F4F0;
        }

        .ios-action-text {
          display: flex;
          flex-direction: column;
        }

        .ios-action-sub {
          font-size: 11px;
          color: #8E8D88;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ios-action-main {
          font-size: 14px;
          font-weight: 600;
          color: inherit;
        }

        .ios-footer {
          text-align: center;
          padding: 24px;
          font-size: 12px;
          color: #71706C;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 640px) {
          .ios-hero-title {
            font-size: 32px;
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
