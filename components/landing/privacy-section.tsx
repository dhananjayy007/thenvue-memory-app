'use client'

import { ShieldCheck, EyeOff, Sparkles } from 'lucide-react'

export function LandingPrivacySection() {
  const pillars = [
    {
      title: 'Private by design',
      desc: 'Your entries, photos, and recordings are strictly yours. Guarded by isolated database row-level security.',
      icon: ShieldCheck,
    },
    {
      title: 'No ads, ever',
      desc: 'We never sell your data, track your behavior across sites, or commercialize your personal reflections.',
      icon: EyeOff,
    },
    {
      title: 'No social feed',
      desc: 'A quiet sanctuary for honest self-reflection without likes, algorithms, or performative distractions.',
      icon: Sparkles,
    },
  ]

  return (
    <section id="privacy" className="landing-privacy-section">
      <div className="landing-privacy-header">
        <span className="landing-quiet-eyebrow">Our Fundamental Promise</span>
        <h2 className="landing-privacy-headline">Your memories aren&apos;t content.</h2>
        <p className="landing-privacy-subhead">Your life belongs to you.</p>
      </div>

      <div className="landing-privacy-pillars-grid">
        {pillars.map((pillar) => {
          const Icon = pillar.icon
          return (
            <div key={pillar.title} className="landing-privacy-pillar-card">
              <div className="pillar-icon-box">
                <Icon size={16} />
              </div>
              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-desc">{pillar.desc}</p>
            </div>
          )
        })}
      </div>

      <div className="privacy-trust-links">
        <a href="/privacy" className="trust-inline-link">
          Read our Privacy Policy →
        </a>
        <a href="/ai-data" className="trust-inline-link">
          AI & Data Transparency →
        </a>
      </div>
    </section>
  )
}
