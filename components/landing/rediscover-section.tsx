'use client'

import { Calendar, MapPin, Image as ImageIcon, Sparkles } from 'lucide-react'

export function LandingRediscoverSection() {
  const moments = [
    {
      id: 'sunset-drive',
      date: 'September 18, 2025',
      time: '6:30 PM',
      location: 'Pacific Highway',
      snippet: 'Windows down, warmth of the late sun, listening to our favorite album with zero rush.',
      label: '1 year ago today',
    },
    {
      id: 'rainy-reading',
      date: 'November 04, 2025',
      time: '3:15 PM',
      location: 'Subko Coffee',
      snippet: 'Found a quiet corner during heavy rainfall. Wrote down five questions about what really matters.',
      label: 'Rediscovered note',
    },
    {
      id: 'dorm-farewell',
      date: 'June 12, 2024',
      time: '11:45 PM',
      location: 'Campus Quad',
      snippet: 'Packed the last cardboard box. We stood under the old banyan tree promising to keep in touch.',
      label: 'Milestone',
    },
  ]

  return (
    <section className="landing-rediscover-section">
      <div className="landing-rediscover-header">
        <span className="landing-quiet-eyebrow">Past Photo Import</span>
        <h2 className="landing-rediscover-headline">Reconstruct your past from your photos.</h2>
        <p className="landing-rediscover-subhead">
          Import photos with their original capture dates. Thenvue clusters moments into memories on your historical timeline.
        </p>
      </div>

      {/* Visual Memory Cards Staged Like an Album */}
      <div className="landing-album-display">
        {moments.map((item, idx) => (
          <div key={item.id} className={`landing-album-card card-${idx + 1}`}>
            <div className="album-card-glow" />
            <div className="album-card-top">
              <span className="album-pill">
                <Sparkles size={11} className="album-sparkle" />
                <span>{item.label}</span>
              </span>
              <span className="album-date">{item.date}</span>
            </div>

            <p className="album-card-quote">&ldquo;{item.snippet}&rdquo;</p>

            <div className="album-card-bottom">
              <span className="album-location">
                <MapPin size={11} /> {item.location}
              </span>
              <span className="album-time">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
