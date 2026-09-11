'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight, Sun, Moon } from 'lucide-react'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'
import { useTheme } from '@/lib/theme'

export function LandingNavbar({ user }: { user?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [theme, toggleTheme] = useTheme()

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
            <ThenvueLogo size={26} />
          </span>
          <span className="landing-brand-name">Thenvue</span>
        </Link>

        {/* Editorial Navigation Links */}
        <div className="landing-nav-links">
          <a href="#ask-your-life" className="landing-nav-link">
            Search
          </a>
          <a href="#rediscover" className="landing-nav-link">
            Rediscover
          </a>
          <a href="#shared-memories" className="landing-nav-link">
            Shared Memories
          </a>
          <a href="#privacy" className="landing-nav-link">
            Privacy
          </a>
          {user ? (
            <Link href="/app" className="landing-nav-link">
              Your Space
            </Link>
          ) : (
            <Link href="/login" className="landing-nav-link">
              Sign in
            </Link>
          )}
        </div>

        {/* Action Row: Theme Toggle + CTA */}
        <div className="landing-nav-actions">
          <button
            type="button"
            className="landing-theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <Link
            href={user ? '/app' : '/login'}
            className="landing-nav-cta-btn"
          >
            <span>{user ? 'Open Space' : 'Try Thenvue'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="landing-mobile-actions-group">
          <button
            type="button"
            className="landing-theme-toggle-btn mobile-only-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            className="landing-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="landing-mobile-menu">
          <a
            href="#ask-your-life"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Search
          </a>
          <a
            href="#rediscover"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Rediscover
          </a>
          <a
            href="#shared-memories"
            className="landing-mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Shared Memories
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
              Your Space
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
              <span>{user ? 'Open Space' : 'Try Thenvue'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
