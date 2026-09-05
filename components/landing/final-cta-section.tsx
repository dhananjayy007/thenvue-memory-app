'use client'

import Link from 'next/link'
import { ArrowRight, Smartphone, Monitor } from 'lucide-react'

export function LandingFinalCtaSection({ user }: { user?: boolean }) {
  return (
    <section className="landing-final-cta-section">
      <div className="landing-final-cta-container">
        <h2 className="landing-final-cta-headline">Start remembering.</h2>
        <p className="landing-final-cta-subhead">
          Give your future self something to look back on.
        </p>

        <div className="landing-final-cta-action">
          <Link
            href={user ? '/app' : '/login'}
            className="landing-final-primary-btn"
          >
            <span>{user ? 'Open your space' : 'Try Thenvue'}</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Platform Availability Options */}
        <div className="landing-platforms-row">
          <span className="platform-label">Available on:</span>
          <div className="platform-pills">
            <Link href={user ? '/app' : '/login'} className="platform-pill">
              <Monitor size={12} />
              <span>Web</span>
            </Link>
            <Link href="/ios" className="platform-pill">
              <Smartphone size={12} />
              <span>iOS</span>
            </Link>
            <Link href="/android" className="platform-pill">
              <Smartphone size={12} />
              <span>Android</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
