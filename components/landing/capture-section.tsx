'use client'

import { PenLine, Camera, Mic, MapPin, Sparkles } from 'lucide-react'

export function LandingCaptureSection() {
  return (
    <section className="landing-capture-section">
      <div className="landing-capture-header">
        <span className="landing-quiet-eyebrow">Effortless Journaling</span>
        <h2 className="landing-capture-headline">Writing comes first. Add what you need.</h2>
        <p className="landing-capture-subhead">
          Start with a sentence or a whole page. Thenvue organizes your memories into a searchable story — with photos and voice notes whenever you want them.
        </p>
      </div>

      {/* Visual Modalities in Order of Priority: Write (Primary), Photo (Optional), Voice */}
      <div className="landing-capture-hierarchy-grid">
        {/* 1. WRITE (Primary Emphasis Card) */}
        <div className="capture-visual-card write-card featured-write-card">
          <div className="capture-card-topbar">
            <div className="capture-visual-badge primary-badge">
              <PenLine size={13} />
              <span>1. Write down what mattered</span>
            </div>
            <span className="capture-role-pill">Core experience</span>
          </div>

          <div className="capture-inner-preview">
            <div className="capture-preview-meta-row">
              <span className="capture-preview-date">October 14 · 9:30 PM</span>
              <span className="capture-preview-location">
                <MapPin size={11} /> Lisbon, Portugal
              </span>
            </div>

            <p className="capture-text-sample">
              &ldquo;The old apartment smelled like cedar and summer rain tonight. Packed the bookshelves first. Found the postcard Alex sent from Lisbon three years ago with &lsquo;don&apos;t forget where we started&rsquo; written on the back.&rdquo;
            </p>

            <div className="capture-ai-index-pill">
              <Sparkles size={11} />
              <span>Indexed by emotion, people, and place automatically</span>
            </div>
          </div>
        </div>

        {/* 2. PHOTO (Optional Supporting Companion) */}
        <div className="capture-visual-card photo-card">
          <div className="capture-card-topbar">
            <div className="capture-visual-badge">
              <Camera size={13} />
              <span>2. Add a photo (optional)</span>
            </div>
            <span className="capture-role-pill subtle-pill">Supporting</span>
          </div>

          <div className="capture-inner-preview photo-preview">
            <div className="capture-photo-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=80"
                alt="Morning light across a wooden table with coffee and notebook"
                className="capture-real-photo"
                loading="lazy"
              />
            </div>
            <p className="capture-supporting-desc">
              Attach a photo when an image holds the feeling of a place or a quiet moment worth keeping.
            </p>
          </div>
        </div>

        {/* 3. VOICE (Spoken Reflection) */}
        <div className="capture-visual-card voice-card">
          <div className="capture-card-topbar">
            <div className="capture-visual-badge">
              <Mic size={13} />
              <span>3. Speak a thought</span>
            </div>
            <span className="capture-role-pill subtle-pill">On the go</span>
          </div>

          <div className="capture-inner-preview voice-preview">
            <div className="voice-audio-indicator">
              <div className="voice-waveform">
                <span className="bar bar-1" />
                <span className="bar bar-2" />
                <span className="bar bar-3" />
                <span className="bar bar-4" />
                <span className="bar bar-5" />
                <span className="bar bar-6" />
                <span className="bar bar-7" />
              </div>
              <span className="voice-duration">0:42</span>
            </div>
            <p className="voice-transcript-sample">
              &ldquo;Voice note while walking: the leaves on the lake road are turning gold. Reminded myself why we came here...&rdquo;
            </p>
            <p className="capture-supporting-desc">
              Speak freely while your hands are full. Thenvue transcribes and indexes your spoken words.
            </p>
          </div>
        </div>
      </div>

      <div className="capture-footer-link-wrap">
        <a href="/voice-journal" className="trust-inline-link">
          Explore the voice journal workflow →
        </a>
      </div>
    </section>
  )
}
