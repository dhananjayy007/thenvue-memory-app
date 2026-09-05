'use client'

import { ShieldCheck, EyeOff, Sparkles } from 'lucide-react'

export function LandingPrivacySection() {
  const pillars = [
    {
      title: 'Private by design',
      desc: 'Your entries, photos, and recordings are strictly yours. Guarded by isolated database security.',
      icon: ShieldCheck,
    },
    {
      title: 'No ads',
      desc: 'We never sell your data, track your behavior, or commercialize your personal reflections.',
      icon: EyeOff,
    },
    {
      title: 'No social feed',
      desc: 'A sanctuary for honest self-expression without likes, algorithms, or performative distractions.',
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
    </section>
  )
}
