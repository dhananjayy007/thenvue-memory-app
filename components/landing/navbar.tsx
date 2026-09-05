'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

export function LandingNavbar({ user }: { user?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`landing-navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
      <nav className="landing-navbar" aria-label="Main Navigation">
        {/* Brand */}
        <Link href="/" className="landing-brand">
          <span className="landing-brand-mark">
            <ThenvueLogo size={28} />
          </span>
          <span className="landing-brand-name">Thenvue</span>
        </Link>

        {/* Minimal Nav Links */}
        <div className="landing-nav-links">
          <a href="#how-it-works" className="landing-nav-link">
            How it works
          </a>
          <a href="#privacy" className="landing-nav-link">
            Privacy
          </a>
          {user ? (
            <Link href="/app" className="landing-nav-link">
              Your Memories
            </Link>
          ) : (
            <Link href="/login" className="landing-nav-link">
              Sign in
            </Link>
          )}
        </div>

        {/* Action CTA */}
        <div className="landing-nav-actions">
          <Link
            href={user ? '/app' : '/login'}
            className="landing-nav-cta-btn"
          >
            <span>{user ? 'Open Thenvue' : 'Try Thenvue'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
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
            href="#how-it-works"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            How it works
          </a>
          <a
            href="#privacy"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Privacy
          </a>
          {user ? (
            <Link
              href="/app"
              className="landing-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              Your Memories
            </Link>
          ) : (
            <Link
              href="/login"
              className="landing-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
          )}
          <div className="landing-mobile-actions">
            <Link
              href={user ? '/app' : '/login'}
              className="landing-nav-cta-btn"
              onClick={() => setMobileOpen(false)}
            >
              <span>{user ? 'Open Thenvue' : 'Try Thenvue'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
