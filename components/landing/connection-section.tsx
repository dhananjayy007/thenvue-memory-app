'use client'

import { Users, MapPin, Calendar, Sparkles, PenLine } from 'lucide-react'

export function LandingConnectionSection() {
  const connectedEntries = [
    {
      label: 'Connected by Person',
      highlight: 'Maya',
      icon: Users,
      connectedMemory: '“Late night packing up the college apartment with Maya”',
      date: 'May 2024',
    },
    {
      label: 'Connected by Place',
      highlight: 'Lisbon',
      icon: MapPin,
      connectedMemory: '“Walking through Alfama during the morning rain”',
      date: 'October 2025',
    },
    {
      label: 'Connected by Thought',
      highlight: 'Starting something new',
      icon: Sparkles,
      connectedMemory: '“First notebook entries written out on the lake house porch”',
      date: 'July 2025',
    },
    {
      label: 'Connected by Season',
      highlight: 'Autumn',
      icon: Calendar,
      connectedMemory: '“The quiet morning the leaves started turning”',
      date: 'October 2023',
    },
  ]

  return (
    <section id="living-connections" className="landing-connection-section">
      <div className="landing-connection-header">
        <span className="landing-quiet-eyebrow">Living Graph</span>
        <h2 className="landing-connection-headline">Your written thoughts connect across time.</h2>
        <p className="landing-connection-subhead">
          A note you write today quietly connects to a conversation you had months ago. Over time, Thenvue maps the invisible threads running through your life.
        </p>
      </div>

      {/* Exhibition Layout: One Written Memory Connected to Related Entries */}
      <div className="landing-single-connection-stage">
        {/* The Primary Written Memory Card */}
        <div className="connection-written-card-side">
          <div className="curated-written-memory-card">
            <div className="curated-card-top">
              <div className="curated-card-badge">
                <PenLine size={11} />
                <span>Written Entry</span>
              </div>
              <span className="curated-card-date">October 14, 2025</span>
            </div>

            <h3 className="curated-memory-title">Corner window sketches with Maya</h3>
            
            <p className="curated-memory-quote">
              &ldquo;Spent the rainy afternoon with Maya sketching ideas for the studio. Reminded me of that conversation we had in the college town two years ago about making something quiet and lasting. We sat until the streetlights came on.&rdquo;
            </p>

            <div className="curated-card-footer">
              <span className="curated-footer-pill">
                <MapPin size={11} /> Lisbon
              </span>
              <span className="curated-footer-pill">
                <Users size={11} /> Maya
              </span>
            </div>
          </div>
        </div>

        {/* Semantic Living Threads to Other Written Entries */}
        <div className="connection-threads-side">
          <div className="threads-container-card">
            <div className="threads-card-header">
              <span className="threads-eyebrow">Memory Threads</span>
              <h4 className="threads-card-title">How Thenvue links this written moment</h4>
            </div>

            <div className="threads-nodes-list">
              {connectedEntries.map((item, idx) => {
                const Icon = item.icon
                const isLast = idx === connectedEntries.length - 1
                return (
                  <div key={item.label} className="thread-node-row">
                    <div className="thread-node-left">
                      <div className="thread-icon-bubble">
                        <Icon size={14} className="thread-icon" />
                      </div>
                      {!isLast && <div className="thread-connecting-line" aria-hidden="true" />}
                    </div>

                    <div className="thread-node-content">
                      <div className="thread-node-meta">
                        <span className="thread-node-label">{item.label}:</span>
                        <strong className="thread-node-value">{item.highlight}</strong>
                      </div>
                      <p className="thread-connected-memory-text">{item.connectedMemory}</p>
                      <span className="thread-node-sub">{item.date}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
