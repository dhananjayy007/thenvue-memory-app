'use client'

import { Users, Plus, PenLine, Sparkles } from 'lucide-react'

export function LandingSharedMemoriesSection() {
  return (
    <section id="shared-memories" className="landing-shared-section">
      <div className="landing-shared-header">
        <span className="landing-quiet-eyebrow">Collaborative Perspectives</span>
        <h2 className="landing-shared-headline">Some memories have more than one side.</h2>
        <p className="landing-shared-subhead">
          Invite someone who was there to add their own words, thoughts, or photos to a memory — so the moment holds more than just your view of it.
        </p>
      </div>

      {/* Visual Demonstration: One Shared Moment, Two Complementary Written Perspectives */}
      <div className="landing-shared-stage">
        <div className="shared-moment-card">
          {/* Header of the Shared Memory */}
          <div className="shared-moment-top">
            <div className="shared-moment-meta">
              <span className="shared-event-date">July 19, 2025</span>
              <span className="shared-event-title">Weekend at the lake house</span>
              <span className="shared-event-place">The Lake House</span>
            </div>
            <div className="shared-collaborators-pill">
              <div className="collaborator-avatars">
                <span className="avatar-chip avatar-you" title="You">You</span>
                <span className="avatar-chip avatar-collaborator" title="Maya">M</span>
              </div>
              <span className="collaborators-count">2 written views</span>
            </div>
          </div>

          {/* Perspective Grid: Side-by-side written reflections */}
          <div className="shared-perspectives-grid">
            {/* Perspective 1: Your View */}
            <div className="perspective-card perspective-primary">
              <div className="perspective-badge">
                <span className="perspective-author">Your words</span>
                <span className="perspective-time">Sunset · 8:10 PM</span>
              </div>

              <p className="perspective-quote">
                &ldquo;We arrived right as the light turned silver. Sat by the wooden dock with our shoes off, listening to the pine trees in the wind. We talked about how different things felt from two years ago.&rdquo;
              </p>

              <div className="perspective-attached-photo-bar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80"
                  alt="Calm water at dusk from the wooden dock"
                  className="perspective-thumb-img"
                  loading="lazy"
                />
                <span className="perspective-thumb-caption">Attached: Sunset from the dock</span>
              </div>
            </div>

            {/* Perspective 2: Maya's View */}
            <div className="perspective-card perspective-secondary">
              <div className="perspective-badge">
                <span className="perspective-author">Maya&apos;s words</span>
                <span className="perspective-time">Nightfall · 9:45 PM</span>
              </div>

              <p className="perspective-quote">
                &ldquo;Found the old acoustic guitar in the pantry. Made cinnamon tea and talked about our first year in the city until 1 AM. Glad we wrote this down before we left.&rdquo;
              </p>

              <div className="perspective-attached-photo-bar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=300&q=80"
                  alt="Warm lantern light on the cabin porch table"
                  className="perspective-thumb-img"
                  loading="lazy"
                />
                <span className="perspective-thumb-caption">Attached: Porch lantern & tea</span>
              </div>
            </div>
          </div>

          {/* Quiet invite prompt bar at the bottom */}
          <div className="shared-invite-bar">
            <div className="invite-bar-content">
              <Users size={15} className="invite-bar-icon" />
              <span className="invite-bar-text">
                Invite Alex, Jordan, or anyone who was there to contribute their view in their own words.
              </span>
            </div>
            <div className="invite-bar-action">
              <span className="invite-btn-preview">
                <Plus size={13} />
                <span>Invite to memory</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
