'use client'

import { Clock, MapPin, Coffee } from 'lucide-react'

export function LandingEmotionalProblem() {
  return (
    <section className="landing-emotional-section">
      <div className="landing-emotional-content">
        <span className="landing-quiet-eyebrow">The Moments That Slip Away</span>
        <h2 className="landing-emotional-headline">
          There are parts of your life you&apos;ve already forgotten.
        </h2>

        <div className="landing-emotional-copy-block">
          <p className="landing-emotional-line">Not the big milestones.</p>
          <p className="landing-emotional-line">The small ones. A quiet morning. A conversation. A person. A feeling.</p>
          <p className="landing-emotional-line">Things that mattered once, but slowly drifted out of reach.</p>
          <p className="landing-emotional-punchline">
            You live your life once. But you don&apos;t have to lose it twice.
          </p>
        </div>
      </div>

      {/* Subtle, Understated Floating Memory Shards */}
      <div className="landing-floating-memories-canvas" aria-hidden="true">
        <div className="floating-memory-fragment fragment-1">
          <div className="fragment-header">
            <Coffee size={12} className="fragment-icon" />
            <span>Tuesday · 8:15 AM</span>
          </div>
          <p className="fragment-text">Espresso by the window at the corner bookshop with Alex...</p>
        </div>

        <div className="floating-memory-fragment fragment-2">
          <div className="fragment-header">
            <MapPin size={12} className="fragment-icon" />
            <span>The Lake House</span>
          </div>
          <p className="fragment-text">Talking on the porch until the stars came out over the water.</p>
        </div>

        <div className="floating-memory-fragment fragment-3">
          <div className="fragment-header">
            <Clock size={12} className="fragment-icon" />
            <span>October 2024</span>
          </div>
          <p className="fragment-text">&ldquo;Let&apos;s remember this walk through Lisbon.&rdquo;</p>
        </div>
      </div>
    </section>
  )
}
