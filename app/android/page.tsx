'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Mic,
  Globe,
} from 'lucide-react'

export default function AndroidDownloadPage() {
  const [downloading, setDownloading] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)

  const handleDownloadClick = () => {
    setDownloading(true)
    setDownloadStarted(true)
    setTimeout(() => {
      setDownloading(false)
    }, 1500)
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
          <div className="android-logo-mark">
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
            <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-1.428V3.242c0-.55.228-1.049.609-1.428zm11.233 11.234l2.585 2.585-11.458 6.547 8.873-9.132zm0-2.096L5.969 1.82l11.458 6.547-2.585 2.585zm1.48 1.48l3.197-1.827c.883-.504.883-1.325 0-1.83l-3.197-1.827-2.18 2.18 2.18 2.18z" />
          </svg>
          <span>Android Edition · Direct Build</span>
          <span className="android-pill-dot" />
          <span className="android-pill-highlight">v1.0 Ready</span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="android-hero-title">
          Thenvue for Android is ready to download.
        </h1>
        <p className="android-hero-sub">
          Install the native Android build directly on your phone or tablet. Experience instant past photo rediscovery, voice reflections, and offline-first private memory journaling.
        </p>

        {/* Download Action Card */}
        <div className="android-download-card">
          <div className="android-download-header">
            <div>
              <span className="android-version-pill">Version 1.0 · Official APK</span>
              <h3 className="android-download-card-title">Direct Package Installer</h3>
              <p className="android-download-card-sub">Compatible with Android 10, 11, 12, 13, 14, and 15</p>
            </div>
            <div className="android-security-badge">
              <ShieldCheck size={20} color="#4ade80" />
              <span>Verified Clean</span>
            </div>
          </div>

          <a
            href="/downloads/Thenvue.apk"
            download
            onClick={handleDownloadClick}
            className="android-primary-download-btn"
          >
            <Download size={20} />
            <span>{downloading ? 'Starting Download...' : 'Download Thenvue APK'}</span>
            <span className="android-btn-size">(~45 MB)</span>
          </a>

          {downloadStarted && (
            <div className="android-started-banner">
              <CheckCircle2 size={16} color="#4ade80" />
              <span>Download started! Follow the 3 quick steps below to install on your Android phone.</span>
            </div>
          )}

          {/* Quick Install Guide Accordion */}
          <div className="android-steps-guide">
            <h4 className="android-steps-heading">How to Install in 30 Seconds:</h4>

            <div className="android-step-row">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Tap Download</strong>
                <span>Download `Thenvue.apk` directly to your phone.</span>
              </div>
            </div>

            <div className="android-step-row">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Allow "Install Unknown Apps"</strong>
                <span>If prompted by Chrome or Files, tap Settings and allow installation from this source.</span>
              </div>
            </div>

            <div className="android-step-row">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Open Thenvue & Sign In</strong>
                <span>Open Thenvue and log in with your email to start remembering your life.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Bento Grid */}
        <div className="android-features-grid">
          <div className="android-feature-card">
            <div className="android-feat-icon-wrap">
              <Smartphone size={20} />
            </div>
            <h4 className="android-feat-title">Optimized for Android</h4>
            <p className="android-feat-text">Material You design, smooth animations, and zero background battery drain.</p>
          </div>

          <div className="android-feature-card">
            <div className="android-feat-icon-wrap">
              <Sparkles size={20} />
            </div>
            <h4 className="android-feat-title">100-Photo Rediscover Quota</h4>
            <p className="android-feat-text">Import past WhatsApp & camera photos with strict EXIF capture date preservation.</p>
          </div>

          <div className="android-feature-card">
            <div className="android-feat-icon-wrap">
              <Mic size={20} />
            </div>
            <h4 className="android-feat-title">Native Audio Reflections</h4>
            <p className="android-feat-text">Record spoken thoughts with instantaneous speech-to-text AI understanding.</p>
          </div>

          <div className="android-feature-card">
            <div className="android-feat-icon-wrap">
              <ShieldCheck size={20} />
            </div>
            <h4 className="android-feat-title">Account Isolation</h4>
            <p className="android-feat-text">Your private memories stay strictly yours with row-level database security.</p>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="android-actions-section">
          <h3 className="android-actions-heading">Other Ways to Use Thenvue</h3>
          <div className="android-actions-row">
            <Link href="/login" className="android-action-button primary">
              <Globe size={18} />
              <div className="android-action-text">
                <span className="android-action-sub">Browser Edition</span>
                <span className="android-action-main">Open Thenvue in Web</span>
              </div>
            </Link>

            <Link href="/ios" className="android-action-button secondary">
              <Smartphone size={18} />
              <div className="android-action-text">
                <span className="android-action-sub">Apple Devices</span>
                <span className="android-action-main">iOS Edition (Coming Soon)</span>
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
          background: #141514;
          color: #F5F4F0;
          position: relative;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
          background: radial-gradient(circle, rgba(227, 160, 124, 0.12) 0%, rgba(201, 125, 87, 0.04) 50%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .android-bg-glow-secondary {
          position: absolute;
          bottom: 0;
          left: 10%;
          width: 500px;
          height: 350px;
          background: radial-gradient(circle, rgba(227, 160, 124, 0.06) 0%, transparent 70%);
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
          color: #A1A09B;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .android-back-btn:hover {
          color: #F5F4F0;
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
          color: #F5F4F0;
        }

        .android-nav-login {
          font-size: 13px;
          color: #E3A07C;
          border: 1px solid rgba(227, 160, 124, 0.3);
          padding: 6px 14px;
          border-radius: 20px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .android-nav-login:hover {
          background: rgba(227, 160, 124, 0.1);
          border-color: rgba(227, 160, 124, 0.6);
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
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          color: #D2D1CB;
          margin-bottom: 24px;
        }

        .android-pill-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #4ade80;
        }

        .android-pill-highlight {
          color: #4ade80;
          font-weight: 600;
        }

        .android-hero-title {
          font-size: 42px;
          line-height: 1.15;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0 0 16px 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #D2D1CB 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .android-hero-sub {
          font-size: 17px;
          line-height: 1.55;
          color: #A1A09B;
          max-width: 620px;
          margin: 0 0 36px 0;
        }

        /* Download Card */
        .android-download-card {
          width: 100%;
          max-width: 580px;
          background: #1A1C1B;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          margin-bottom: 50px;
          text-align: left;
        }

        .android-download-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 12px;
        }

        .android-version-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: #E3A07C;
          background: rgba(227, 160, 124, 0.12);
          border: 1px solid rgba(227, 160, 124, 0.25);
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 6px;
        }

        .android-download-card-title {
          font-size: 19px;
          font-weight: 600;
          color: #F5F4F0;
          margin: 0 0 4px 0;
        }

        .android-download-card-sub {
          font-size: 13px;
          color: #8E8D88;
          margin: 0;
        }

        .android-security-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.25);
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #4ade80;
          white-space: nowrap;
        }

        .android-primary-download-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #E3A07C 0%, #C97D57 100%);
          color: #141514;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          padding: 16px 24px;
          border-radius: 14px;
          box-shadow: 0 8px 20px rgba(227, 160, 124, 0.25);
          transition: all 0.2s ease;
          margin-bottom: 16px;
        }
        .android-primary-download-btn:hover {
          opacity: 0.94;
          transform: translateY(-1px);
        }

        .android-btn-size {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 400;
        }

        .android-started-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.25);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 12px;
          color: #86efac;
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .android-steps-guide {
          background: #232523;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 18px;
        }

        .android-steps-heading {
          font-size: 13px;
          font-weight: 600;
          color: #D2D1CB;
          margin: 0 0 14px 0;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .android-step-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .android-step-row:last-child {
          margin-bottom: 0;
        }

        .step-number {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(227, 160, 124, 0.2);
          color: #E3A07C;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          font-size: 13px;
        }
        .step-content strong {
          color: #F5F4F0;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .step-content span {
          color: #8E8D88;
          line-height: 1.4;
        }

        /* Features Bento Grid */
        .android-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 740px;
          margin-bottom: 50px;
          text-align: left;
        }

        .android-feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .android-feature-card:hover {
          transform: translateY(-2px);
          border-color: rgba(227, 160, 124, 0.25);
        }

        .android-feat-icon-wrap {
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

        .android-feat-title {
          font-size: 15px;
          font-weight: 600;
          color: #F5F4F0;
          margin: 0 0 6px 0;
        }

        .android-feat-text {
          font-size: 13px;
          line-height: 1.45;
          color: #8E8D88;
          margin: 0;
        }

        .android-actions-section {
          width: 100%;
          max-width: 580px;
          text-align: center;
        }

        .android-actions-heading {
          font-size: 18px;
          font-weight: 600;
          color: #D2D1CB;
          margin: 0 0 16px 0;
        }

        .android-actions-row {
          display: flex;
          gap: 14px;
        }

        .android-action-button {
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

        .android-action-button.primary {
          background: #232523;
          border: 1px solid rgba(227, 160, 124, 0.35);
          color: #F5F4F0;
        }
        .android-action-button.primary:hover {
          background: #2b2e2b;
          border-color: #E3A07C;
        }

        .android-action-button.secondary {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #D2D1CB;
        }
        .android-action-button.secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #F5F4F0;
        }

        .android-action-text {
          display: flex;
          flex-direction: column;
        }

        .android-action-sub {
          font-size: 11px;
          color: #8E8D88;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .android-action-main {
          font-size: 14px;
          font-weight: 600;
          color: inherit;
        }

        .android-footer {
          text-align: center;
          padding: 24px;
          font-size: 12px;
          color: #71706C;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 640px) {
          .android-hero-title {
            font-size: 32px;
          }
          .android-features-grid {
            grid-template-columns: 1fr;
          }
          .android-actions-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
