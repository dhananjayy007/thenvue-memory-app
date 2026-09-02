'use client'

import { LandingNavbar } from '@/components/landing/navbar'
import { LandingHero } from '@/components/landing/hero'
import { LandingHowItWorks } from '@/components/landing/how-it-works'
import { LandingBentoFeatures } from '@/components/landing/bento-features'
import { LandingDemoSearchWidget } from '@/components/landing/demo-search-widget'
import { LandingFounderStory } from '@/components/landing/founder-story'
import { LandingDownloadFooter } from '@/components/landing/download-footer-banner'

export function ThenvueLandingPage({ user }: { user?: boolean }) {
  return (
    <div className="landing-root-container">
      {/* Sticky Frosted Header */}
      <LandingNavbar user={user} />

      {/* Main Sections */}
      <main className="landing-main">
        {/* Hero with Phone Mockup */}
        <LandingHero user={user} />

        {/* 3-Step Grid: How it works */}
        <LandingHowItWorks />

        {/* Bento Grid: Feature Deep Dives */}
        <LandingBentoFeatures />

        {/* Interactive Try-The-Search Demo Widget */}
        <LandingDemoSearchWidget />
      </main>

      {/* Founder Story Section */}
      <LandingFounderStory />

      {/* Conversion Banner & Footer */}
      <LandingDownloadFooter />
    </div>
  )
}

