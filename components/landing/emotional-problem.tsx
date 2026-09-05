'use client'

import { Clock, MapPin, Coffee, Sparkles } from 'lucide-react'

export function LandingEmotionalProblem() {
  return (
    <section className="landing-emotional-section">
      <div className="landing-emotional-content">
        <span className="landing-quiet-eyebrow">The quiet passage of time</span>
        <h2 className="landing-emotional-headline">
          You won&apos;t remember this.
        </h2>

        <div className="landing-emotional-copy-block">
          <p className="landing-emotional-line">Not the coffee.</p>
          <p className="landing-emotional-line">Not the conversation.</p>
          <p className="landing-emotional-line">Not this random Tuesday.</p>
          <p className="landing-emotional-punchline">
            But someday, you&apos;ll wish you did.
          </p>
        </div>
      </div>

      {/* Subtle Nostalgic Floating Memory Shards */}
      <div className="landing-floating-memories-canvas" aria-hidden="true">
        <div className="floating-memory-fragment fragment-1">
          <div className="fragment-header">
            <Coffee size={12} className="fragment-icon" />
            <span>Tuesday · 8:15 AM</span>
          </div>
          <p className="fragment-text">Cortado at the wooden counter by the window...</p>
        </div>

        <div className="floating-memory-fragment fragment-2">
          <div className="fragment-header">
            <MapPin size={12} className="fragment-icon" />
            <span>Evening Walk</span>
          </div>
          <p className="fragment-text">Talking about future plans until the streetlights came on.</p>
        </div>

        <div className="floating-memory-fragment fragment-3">
          <div className="fragment-header">
            <Clock size={12} className="fragment-icon" />
            <span>July 2024</span>
          </div>
          <p className="fragment-text">&ldquo;Let&apos;s never forget this sunset.&rdquo;</p>
        </div>
      </div>
    </section>
  )
}
