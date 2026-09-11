'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, Users, Sparkles, ChevronDown, Smartphone, Monitor, PenLine, Camera } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

interface HeroKeepsake {
  id: string
  photoUrl: string
  photoAlt: string
  date: string
  time: string
  title: string
  place: string
  person: string
  writtenEntry: string
  hasPhoto: boolean
  askQuery: string
  reflection: string
}

const HERO_KEEPSAKES: HeroKeepsake[] = [
  {
    id: 'lisbon-cafe',
    photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    photoAlt: 'Quiet corner café table with ceramic espresso cup in warm morning sunlight',
    date: 'October 14, 2025',
    time: '4:15 PM',
    title: 'Corner window after the rain',
    place: 'Lisbon',
    person: 'Maya',
    writtenEntry:
      'Caught up over pour-overs at the corner table after the afternoon shower cleared. We sat watching the light bounce off the wet cobblestones, talking about what we want to build next year and how fast the summer went. Writing this down before the feeling fades.',
    hasPhoto: true,
    askQuery: 'When did I write about sitting by the corner window in Lisbon?',
    reflection: 'You wrote about spending three quiet hours with Maya after the rain stopped, talking about plans for the year ahead.',
  },
  {
    id: 'lake-house-dock',
    photoUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
    photoAlt: 'Wooden dock over still lake water surrounded by quiet pines',
    date: 'July 19, 2025',
    time: '6:30 PM',
    title: 'Sunset out on the wooden dock',
    place: 'The Lake House',
    person: 'Alex',
    writtenEntry:
      'Sat on the cedar dock with Alex until the water turned to glass. Total silence except for the breeze through the pines. We talked about how different everything felt two years ago, and how good it feels to have arrived here.',
    hasPhoto: true,
    askQuery: 'What did I write on the dock at the lake house?',
    reflection: 'You wrote about sitting with Alex until twilight, reflecting on how much had changed over two years.',
  },
]

export function LandingHero({ user }: { user?: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const current = HERO_KEEPSAKES[activeIdx]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HERO_KEEPSAKES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="landing-hero-container">
      {/* Background paper warmth */}
      <div className="landing-ambient-glow" aria-hidden="true" />

      <div className="landing-hero-header-block">
        <span className="landing-quiet-eyebrow">A Quiet Keepsake for Your Past</span>

        <h1 className="landing-hero-title">
          Write down what mattered today.
        </h1>

        <p className="landing-hero-subtitle">
          Someone who knows your past, and helps you find the parts of your life you lost along the way. Add a photo if there&apos;s one worth keeping.
        </p>

        <div className="landing-hero-cta-row">
          <Link
            href={user ? '/app' : '/login'}
            className="landing-hero-primary-cta"
          >
            <span>{user ? 'Open your journal' : 'Start writing'}</span>
            <ArrowRight size={14} />
          </Link>

          <a
            href="#ask-your-life"
            className="landing-hero-secondary-cta"
          >
            <span>See how it works</span>
            <ChevronDown size={13} />
          </a>
        </div>

        {/* Platform Availability Options */}
        <div className="landing-platforms-row">
          <span className="platform-label">Available on:</span>
          <div className="platform-pills">
            <Link href={user ? '/app' : '/login'} className="platform-pill">
              <Monitor size={12} />
              <span>Web</span>
            </Link>
            <Link href="/ios" className="platform-pill">
              <Smartphone size={12} />
              <span>iOS</span>
            </Link>
            <Link href="/android" className="platform-pill">
              <Smartphone size={12} />
              <span>Android</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Visual: Written Journal Entry First, Supporting Photo Attached */}
      <div className="landing-hero-visual-frame">
        <div className="landing-written-keepsake-card">
          {/* Header of Written Keepsake */}
          <div className="written-keepsake-header">
            <div className="written-keepsake-meta">
              <span className="written-keepsake-date">{current.date} · {current.time}</span>
              <span className="written-keepsake-badge">
                <PenLine size={11} />
                <span>Written Entry</span>
              </span>
            </div>
            <div className="written-keepsake-place-pill">
              <MapPin size={11} />
              <span>{current.place}</span>
            </div>
          </div>

          {/* Main Written Body with optional clipped companion photo */}
          <div className="written-keepsake-content-layout">
            <div className="written-keepsake-text-column">
              <h3 className="written-keepsake-title">{current.title}</h3>
              <p className="written-keepsake-body">
                &ldquo;{current.writtenEntry}&rdquo;
              </p>

              <div className="written-keepsake-footer-tags">
                <span className="keepsake-tag">
                  <Users size={11} /> {current.person}
                </span>
                <span className="keepsake-tag">Reflection</span>
              </div>
            </div>

            {/* Optional supporting photo clipped alongside */}
            {current.hasPhoto && (
              <div className="written-keepsake-photo-attachment">
                <div className="supporting-polaroid-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.photoUrl}
                    alt={current.photoAlt}
                    className="supporting-photo-img"
                  />
                  <span className="supporting-photo-label">Attached moment</span>
                </div>
              </div>
            )}
          </div>

          {/* Ask Your Life Grounded Reflection Bar */}
          <div className="hero-reflection-card">
            <div className="hero-reflection-query">
              <CustomBrainIcon size={14} className="hero-brain-icon" />
              <span className="query-text">&ldquo;{current.askQuery}&rdquo;</span>
            </div>
            <div className="hero-reflection-response">
              <Sparkles size={12} className="hero-sparkle-icon" />
              <p className="response-text">&ldquo;{current.reflection}&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
