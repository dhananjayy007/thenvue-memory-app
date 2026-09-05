'use client'

import { Users, MapPin, Calendar, Sparkles, ArrowDown } from 'lucide-react'

export function LandingConnectionSection() {
  const chain = [
    { label: 'Person', value: 'Maya', icon: Users, sub: 'Close friend & collaborator' },
    { label: 'Place', value: 'Powai', icon: MapPin, sub: 'Evening lakefront walk' },
    { label: 'Time', value: 'August 2026', icon: Calendar, sub: 'Late summer sunset' },
    { label: 'Moment', value: 'Coffee after work', icon: Sparkles, sub: 'Planning the new studio' },
  ]

  return (
    <section className="landing-connection-section">
      <div className="landing-connection-header">
        <span className="landing-quiet-eyebrow">Living Graph</span>
        <h2 className="landing-connection-headline">Your memories are connected.</h2>
        <p className="landing-connection-subhead">
          Over time, Thenvue connects the pieces of your life so individual memories become a story.
        </p>
      </div>

      {/* Visual Chain / Flow */}
      <div className="landing-connection-chain">
        {chain.map((item, idx) => {
          const Icon = item.icon
          const isLast = idx === chain.length - 1
          return (
            <div key={item.label} className="connection-chain-node">
              <div className="connection-node-card">
                <div className="node-icon-wrap">
                  <Icon size={14} className="node-icon" />
                  <span className="node-label">{item.label}</span>
                </div>
                <strong className="node-value">{item.value}</strong>
                <span className="node-sub">{item.sub}</span>
              </div>

              {!isLast && (
                <div className="connection-chain-connector" aria-hidden="true">
                  <div className="connector-line" />
                  <ArrowDown size={14} className="connector-arrow" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
