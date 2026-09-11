'use client'

import { Calendar, MapPin, Sparkles, Camera, PenLine } from 'lucide-react'

export function LandingRediscoverSection() {
  const sampleRediscoveredEntries = [
    {
      id: 'lisbon-street',
      date: 'October 14, 2021',
      location: 'Lisbon, Alfama',
      person: 'Maya',
      snippet: 'Found this afternoon in my camera roll: the warm cobblestone streets right after the rain.',
      timeDistance: '4 years ago',
      photoUrl: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'lake-house-sunrise',
      date: 'August 03, 2022',
      location: 'The Lake House',
      person: 'Alex & Jordan',
      snippet: 'First sunrise on the wooden dock before anyone else was up.',
      timeDistance: '3 years ago',
      photoUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'corner-bookshop',
      date: 'November 19, 2023',
      location: 'Corner Bookshop',
      person: 'Sam',
      snippet: 'Reading poetry out of print on the top shelf while waiting for tea.',
      timeDistance: '2 years ago',
      photoUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    },
  ]

  return (
    <section id="rediscover" className="landing-rediscover-section">
      <div className="landing-rediscover-header">
        <span className="landing-quiet-eyebrow">Archival Import</span>
        <h2 className="landing-rediscover-headline">Have old photos? Bring them in, too.</h2>
        <p className="landing-rediscover-subhead">
          Thenvue is built for writing your days down. But if you have years of photos sitting in camera rolls, you can import them in batches. Thenvue reads their hidden dates and places to weave forgotten moments into your timeline.
        </p>
      </div>

      {/* Balanced Showcase: Transforming dormant camera roll files into written memories */}
      <div className="rediscover-showcase-container">
        <div className="rediscover-exif-card">
          <div className="exif-polaroid-side">
            <div className="archival-polaroid-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=700&q=80"
                alt="Archival photo of a morning corner table"
                className="archival-polaroid-img"
                loading="lazy"
              />
              <div className="archival-polaroid-chin">
                <span className="chin-caption">Lisbon · October 14, 2021</span>
                <span className="chin-meta">Imported from camera roll</span>
              </div>
            </div>
          </div>

          <div className="exif-details-side">
            <div className="exif-pill-badge">
              <Sparkles size={13} className="exif-sparkle-icon" />
              <span>Camera Roll → Written Timeline</span>
            </div>

            <h3 className="exif-title">Turn dormant photos into entries you can revisit</h3>
            <p className="exif-desc">
              Instead of thousands of unsearchable files buried in albums, Thenvue reconstructs your past timeline so each moment sits in chronological context ready for your thoughts.
            </p>

            <div className="exif-metadata-list">
              <div className="exif-meta-item">
                <Calendar size={13} className="meta-icon" />
                <div className="meta-info">
                  <span className="meta-label">Original Timestamp</span>
                  <span className="meta-value">October 14, 2021 · 4:20 PM</span>
                </div>
              </div>

              <div className="exif-meta-item">
                <MapPin size={13} className="meta-icon" />
                <div className="meta-info">
                  <span className="meta-label">Discovered Location</span>
                  <span className="meta-value">Alfama, Lisbon (via EXIF)</span>
                </div>
              </div>

              <div className="exif-meta-item">
                <PenLine size={13} className="meta-icon" />
                <div className="meta-info">
                  <span className="meta-label">Timeline State</span>
                  <span className="meta-value">Placed into personal archive with reflection prompt</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Small timeline cards showing written memories derived from import */}
        <div className="rediscover-cards-row">
          {sampleRediscoveredEntries.map((moment) => (
            <div key={moment.id} className="rediscover-mini-card">
              <div className="mini-card-photo-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={moment.photoUrl}
                  alt={moment.snippet}
                  className="mini-card-photo"
                  loading="lazy"
                />
                <span className="mini-card-distance-badge">{moment.timeDistance}</span>
              </div>

              <div className="mini-card-body">
                <div className="mini-card-header">
                  <span className="mini-card-date">{moment.date}</span>
                  <span className="mini-card-place">
                    <MapPin size={11} /> {moment.location}
                  </span>
                </div>
                <p className="mini-card-caption">&ldquo;{moment.snippet}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
