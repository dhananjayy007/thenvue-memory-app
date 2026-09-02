'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

export function LandingNavbar({ user }: { user?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="landing-navbar-wrapper">
      <nav className="landing-navbar" aria-label="Main Navigation">
        {/* Brand */}
        <Link href="/" className="landing-brand">
          <span className="landing-brand-mark" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ThenvueLogo size={34} />
          </span>
          <span className="landing-brand-name">Thenvue</span>
        </Link>

        {/* Center Nav Links */}
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">
            Features
          </a>
          <a href="#how-it-works" className="landing-nav-link">
            How It Works
          </a>
          <a href="#ask-ai" className="landing-nav-link">
            Ask AI
          </a>
          <a href="#demo" className="landing-nav-link">
            Try Demo
          </a>
          <a href="#privacy" className="landing-nav-link">
            Privacy
          </a>
        </div>

        {/* Right CTA Actions */}
        <div className="landing-nav-actions">
          {user ? (
            <Link href="/app" className="landing-cta-secondary">
              Go to Your Space <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="landing-nav-link landing-login-link">
                Open Web App
              </Link>
              <a href="#download" className="landing-cta-pill">
                Get the App
              </a>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="landing-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="landing-mobile-menu">
          <a
            href="#features"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            How It Works
          </a>
          <a
            href="#ask-ai"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Ask AI
          </a>
          <a
            href="#demo"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Try Demo
          </a>
          <a
            href="#privacy"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Privacy
          </a>
          <div className="landing-mobile-actions">
            {user ? (
              <Link
                href="/app"
                className="landing-cta-pill"
                onClick={() => setMobileOpen(false)}
              >
                Go to Your Space
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="landing-cta-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  Open Web App
                </Link>
                <a
                  href="#download"
                  className="landing-cta-pill"
                  onClick={() => setMobileOpen(false)}
                >
                  Get the App
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
