'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, Users, Sparkles, ChevronDown } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

interface SampleMemory {
  id: string
  date: string
  time: string
  title: string
  place: string
  person: string
  category: string
  thought: string
  reflection: string
}

const SAMPLE_MEMORIES: SampleMemory[] = [
  {
    id: 'coffee-maya',
    date: 'August 24, 2026',
    time: '7:15 PM',
    title: 'Coffee after work with Maya',
    place: 'Powai, Mumbai',
    person: 'Maya',
    category: 'Life',
    thought: 'Caught up over pour-overs at the corner table. Talked about moving into our new studio and how fast the summer went.',
    reflection: 'You met Maya in Powai on a late August evening to talk about your new studio plans.',
  },
  {
    id: 'kyoto-morning',
    date: 'October 12, 2025',
    time: '8:40 AM',
    title: 'Rainy morning walk in Kyoto',
    place: 'Gion, Kyoto',
    person: 'Liam',
    category: 'Travel',
    thought: 'The streets were empty after the rainfall. Found a small cedar tea house playing quiet jazz on vinyl.',
    reflection: 'You took an early morning walk with Liam in Kyoto right after the autumn rain.',
  },
]

export function LandingHero({ user }: { user?: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const current = SAMPLE_MEMORIES[activeIdx]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SAMPLE_MEMORIES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="landing-hero-container">
      {/* Background ambient warmth */}
      <div className="landing-ambient-glow" aria-hidden="true" />

      <div className="landing-hero-header-block">
        <h1 className="landing-hero-title">
          Your life, remembered.
        </h1>
        <p className="landing-hero-subtitle">
          Capture the moments you don&apos;t want to lose. Find them again when you need them.
        </p>

        <div className="landing-hero-cta-row">
          <Link
            href={user ? '/app' : '/login'}
            className="landing-hero-primary-cta"
          >
            <span>{user ? 'Go to your space' : 'Try Thenvue'}</span>
            <ArrowRight size={15} />
          </Link>
          <a
            href="#how-it-works"
            className="landing-hero-secondary-cta"
          >
            <span>See how it works</span>
            <ChevronDown size={14} />
          </a>
        </div>
      </div>

      {/* Hero Visual: One calm, beautiful Thenvue product preview */}
      <div className="landing-hero-visual-frame">
        <div className="landing-product-preview-card">
          {/* Top minimal header inside the product preview */}
          <div className="landing-preview-topbar">
            <div className="preview-topbar-left">
              <span className="preview-app-name">Thenvue</span>
              <span className="preview-demo-tag">Sample memory</span>
            </div>
            <div className="preview-topbar-right">
              <span className="preview-indicator-dot" />
              <span className="preview-status-text">Private timeline</span>
            </div>
          </div>

          {/* Memory Card Body */}
          <div className="landing-preview-memory" key={current.id}>
            <div className="preview-memory-meta">
              <span className="preview-memory-date">{current.date} · {current.time}</span>
              <span className="preview-memory-tag">{current.category}</span>
            </div>

            <h3 className="preview-memory-title">{current.title}</h3>
            <p className="preview-memory-thought">{current.thought}</p>

            <div className="preview-memory-footer">
              <span className="preview-pill">
                <MapPin size={11} />
                <span>{current.place}</span>
              </span>
              <span className="preview-pill">
                <Users size={11} />
                <span>{current.person}</span>
              </span>
            </div>
          </div>

          {/* Ask Your Life Transition Overlay / Grounded Pill */}
          <div className="landing-preview-ask-bar">
            <div className="preview-ask-query">
              <CustomBrainIcon size={14} className="preview-brain-icon" />
              <span className="preview-ask-text">&ldquo;When was I in {current.place.split(',')[0]} with {current.person}?&rdquo;</span>
            </div>
            <div className="preview-ask-result">
              <Sparkles size={12} className="preview-sparkle-icon" />
              <p className="preview-reflection-text">&ldquo;{current.reflection}&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
