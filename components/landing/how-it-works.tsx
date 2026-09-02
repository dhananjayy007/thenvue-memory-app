'use client'

import { Camera, Clock3, Filter, MapPin, Mic, PenLine,  Users } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

export function LandingHowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Capture in Seconds',
      description:
        'Write a thought, record a natural voice reflection, or attach a photo from your day. Thenvue automatically indexes your location and context without friction.',
      badges: [
        { icon: PenLine, label: 'Instant text thoughts' },
        { icon: Mic, label: 'Voice-to-text intelligence' },
        { icon: Camera, label: 'Same-day photo memories' },
      ],
    },
    {
      number: '02',
      title: 'Connect the Dots',
      description:
        'Your entries are automatically woven into an elegant chronological story. Filter instantly by key people in your life, places visited, and media highlights.',
      badges: [
        { icon: Clock3, label: 'Chronological timeline' },
        { icon: Users, label: 'People connections' },
        { icon: MapPin, label: 'Place memory mapping' },
      ],
    },
    {
      number: '03',
      title: 'Ask Your Life',
      description:
        'Ask natural questions about what you did, who you met, or how you felt. Thenvue reflects strictly on your private journal with verified memory citations.',
      badges: [
        { icon: CustomBrainIcon, label: 'Private neural search' },
        { icon: CustomBrainIcon, label: 'Grounded memory answers' },
        { icon: Filter, label: 'Deep semantic retrieval' },
      ],
    },
  ]

  return (
    <section id="how-it-works" className="landing-section">
      <div className="landing-section-header">
        <div className="landing-section-eyebrow">SIMPLE & INTENTIONAL</div>
        <h2 className="landing-section-title">How Thenvue Works</h2>
        <p className="landing-section-subhead">
          Designed for quiet reflection. No social feeds, no algorithmic distractions—just your life,
          preserved and understood.
        </p>
      </div>

      <div className="landing-steps-grid">
        {steps.map((step) => (
          <div key={step.number} className="landing-step-card">
            <div className="landing-step-top">
              <span className="landing-step-number">{step.number}</span>
            </div>

            <h3 className="landing-step-title">{step.title}</h3>
            <p className="landing-step-desc">{step.description}</p>

            <div className="landing-step-badges">
              {step.badges.map((badge, idx) => {
                const Icon = badge.icon
                return (
                  <div key={idx} className="landing-step-badge-item">
                    <Icon size={13} className="landing-badge-icon" />
                    <span>{badge.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
