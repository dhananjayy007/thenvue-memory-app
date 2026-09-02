'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  MapPin,
  Mic,
  PenLine,
  
  Users,
} from 'lucide-react'

import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

interface MockMemory {
  id: string
  time: string
  tag: string
  text: string
  location: string
  person?: string
  badge: string
  aiReflection: string
  secondaryTime: string
  secondaryTag: string
  secondaryText: string
}

const DYNAMIC_ENTRIES: MockMemory[] = [
  {
    id: 'powai',
    time: 'Today · 7:15 PM',
    tag: 'Powai',
    text: 'Evening walk near the lake with Aradhya after the gym. Discussed the new project plans over filter coffee.',
    location: 'Hiranandani, Powai',
    person: 'Aradhya',
    badge: 'Fitness',
    aiReflection: 'You were in Powai yesterday evening with Aradhya after working out at the gym.',
    secondaryTime: 'Yesterday · 9:30 AM',
    secondaryTag: 'Home',
    secondaryText: 'Finished reading the first three chapters of the design history book before morning standup.',
  },
  {
    id: 'coffee',
    time: 'Saturday · 11:30 AM',
    tag: 'Coffee',
    text: 'Saturday morning pour-over at Blue Tokai while sketching the mobile navigation flow and gesture physics.',
    location: 'Blue Tokai Coffee',
    person: 'Rohan',
    badge: 'Design',
    aiReflection: 'You visited Blue Tokai on Saturday to design the new gesture animations.',
    secondaryTime: 'Friday · 6:45 PM',
    secondaryTag: 'Studio',
    secondaryText: 'Shipped the database schema updates and tested the new neural search query embedding pipeline.',
  },
  {
    id: 'college',
    time: 'May 20 · 11:45 PM',
    tag: 'Milestone',
    text: 'Late night dorm coding session with Vikram and Ananya for the hackathon final presentation.',
    location: 'Hostel 4, Campus',
    person: 'Vikram, Ananya',
    badge: 'Hackathon',
    aiReflection: 'You won 1st runner up at the college hackathon with Vikram and Ananya.',
    secondaryTime: 'May 18 · 4:00 PM',
    secondaryTag: 'Campus',
    secondaryText: 'Finalized the audio waveform visualizer and rehearsed our 3-minute stage demo.',
  },
]

export function LandingHero({ user }: { user?: boolean }) {
  const [activeEntryIndex, setActiveEntryIndex] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  // Dynamic continuous auto-cycle animation inside phone mockup
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveEntryIndex((prev) => (prev + 1) % DYNAMIC_ENTRIES.length)
    }, 3800)
    return () => clearInterval(timer)
  }, [])

  // Scroll-linked parallax calculation for phone mockup
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Parallax translation: moves slower than scroll to create depth (capped gracefully)
  const parallaxTranslateY = Math.min(scrollY * 0.12, 80)
  const currentMemory = DYNAMIC_ENTRIES[activeEntryIndex]

  return (
    <section className="landing-hero-section">
      {/* Background Radial Glow */}
      <div className="landing-hero-glow" aria-hidden="true" />

      <div className="landing-hero-content">
        {/* Eyebrow */}
        <div className="landing-eyebrow-pill">
          <span className="landing-eyebrow-dot" />
          YOUR PERSONAL MEMORY ARCHIVE
        </div>

        {/* Headline */}
        <h1 className="landing-hero-headline">
          A quiet place to capture, recall, and understand your life.
        </h1>

        {/* Subheadline */}
        <p className="landing-hero-subhead">
          Write, speak, or snap your daily moments. Thenvue connects your people, tags your places,
          and lets you naturally ask questions about your past.
        </p>

        {/* Direct Download Action CTAs */}
        <div className="landing-hero-cta-group">
          <a href="/downloads/Thenvue.ipa" download className="landing-store-badge">
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
          </a>


          <a href="/downloads/Thenvue.apk" download className="landing-store-badge">
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
          </a>
        </div>



        {/* Privacy Trust Badge right below download buttons */}
        <div className="landing-privacy-trust-badge">
          <span>🔒 100% Private & Encrypted</span>
        </div>

        {/* Secondary Browser Link */}
        <div className="landing-hero-secondary-link">
          <Link href={user ? '/app' : '/login'} className="landing-text-link">
            {user ? 'Go directly to your memories' : 'Or continue in browser'}{' '}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Hero Visual Mockup Container with Parallax & Hover Support */}
      <div className="landing-hero-visual">
        <div
          className="landing-phone-mockup"
          style={
            {
              '--parallax-offset': `${parallaxTranslateY}px`,
            } as React.CSSProperties
          }
        >
          {/* Phone Speaker Notch */}

          <div className="landing-phone-notch">
            <span className="landing-phone-camera" />
          </div>

          {/* App Header Inside Phone */}
          <div className="landing-mockup-header">
            <div>
              <span className="landing-mockup-brand">Thenvue</span>
              <p className="landing-mockup-greeting">Good evening, Dhananjay</p>
            </div>
            <div className="landing-mockup-avatar">D</div>
          </div>

          {/* AI Search Bar Inside Phone */}
          <div className="landing-mockup-search">
            <CustomBrainIcon size={16} color="var(--accent)" />
            <span>Ask anything about your past...</span>
            <CustomBrainIcon size={13} className="landing-sparkle-icon" />
          </div>

          {/* Quick Capture Prompts */}
          <div className="landing-mockup-quick-row">
            <span className="landing-mockup-pill active">
              <PenLine size={11} /> Write
            </span>
            <span className="landing-mockup-pill">
              <Mic size={11} /> Voice note
            </span>
            <span className="landing-mockup-pill">
              <Camera size={11} /> Photo
            </span>
          </div>

          {/* Dynamic Auto-Cycling Timeline Card Preview */}
          <div className="landing-mockup-timeline">
            <div key={currentMemory.id} className="landing-mockup-card dynamic-fade-slide">
              <div className="landing-mockup-card-header">
                <span className="landing-mockup-time">{currentMemory.time}</span>
                <span className="landing-mockup-tag">{currentMemory.tag}</span>
              </div>
              <strong className="landing-mockup-card-text">{currentMemory.text}</strong>
              <div className="landing-mockup-meta">
                <span>
                  <MapPin size={10} /> {currentMemory.location}
                </span>
                {currentMemory.person && (
                  <span>
                    <Users size={10} /> {currentMemory.person}
                  </span>
                )}
                <span className="landing-mockup-badge">{currentMemory.badge}</span>
              </div>
            </div>

            <div className="landing-mockup-card secondary">
              <div className="landing-mockup-card-header">
                <span className="landing-mockup-time">{currentMemory.secondaryTime}</span>
                <span className="landing-mockup-tag">{currentMemory.secondaryTag}</span>
              </div>
              <strong className="landing-mockup-card-text">
                {currentMemory.secondaryText}
              </strong>
            </div>
          </div>

          {/* Floating AI Answer Pill with Dynamic Text */}
          <div className="landing-floating-ai-card">
            <div className="landing-floating-ai-header">
              <CustomBrainIcon size={13} color="var(--accent)" />
              <span>Grounded in timeline memory</span>
            </div>
            <p className="landing-floating-ai-text">&ldquo;{currentMemory.aiReflection}&rdquo;</p>
          </div>
        </div>
      </div>
    </section>
  )
}
