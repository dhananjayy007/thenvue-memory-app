'use client'

import { PenLine, Camera, Mic, MapPin, Volume2 } from 'lucide-react'

export function LandingCaptureSection() {
  return (
    <section className="landing-capture-section">
      <div className="landing-capture-header">
        <span className="landing-quiet-eyebrow">Effortless Input</span>
        <h2 className="landing-capture-headline">Don&apos;t wait until it&apos;s important.</h2>
        <p className="landing-capture-subhead">
          A thought. A photo. A voice note. A moment.
        </p>
      </div>

      {/* Visual, Tactile Capture Examples */}
      <div className="landing-capture-visual-row">
        {/* 1. Write */}
        <div className="capture-visual-card write-card">
          <div className="capture-visual-badge">
            <PenLine size={13} />
            <span>Write</span>
          </div>
          <div className="capture-inner-preview">
            <span className="capture-preview-date">Today · 9:30 PM</span>
            <p className="capture-text-sample">
              &ldquo;The night air is finally cooling down. Reminded myself why we started this.&rdquo;
            </p>
            <div className="capture-bottom-tag">
              <MapPin size={10} /> Balcony
            </div>
          </div>
        </div>

        {/* 2. Photo */}
        <div className="capture-visual-card photo-card">
          <div className="capture-visual-badge">
            <Camera size={13} />
            <span>Photo</span>
          </div>
          <div className="capture-inner-preview photo-preview">
            <div className="capture-photo-frame">
              <div className="photo-placeholder-art">
                <span className="photo-art-text">Morning light in the studio</span>
              </div>
            </div>
            <span className="capture-photo-caption">8:15 AM · Filter coffee & morning notes</span>
          </div>
        </div>

        {/* 3. Voice */}
        <div className="capture-visual-card voice-card">
          <div className="capture-visual-badge">
            <Mic size={13} />
            <span>Voice</span>
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
              &ldquo;Idea for the new design: keep it quiet, like flipping through physical paper...&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
