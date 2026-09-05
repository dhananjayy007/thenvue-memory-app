'use client'

import { LandingNavbar } from '@/components/landing/navbar'
import { LandingHero } from '@/components/landing/hero'
import { LandingEmotionalProblem } from '@/components/landing/emotional-problem'
import { LandingAhaMoment } from '@/components/landing/aha-moment'
import { LandingRediscoverSection } from '@/components/landing/rediscover-section'
import { LandingCaptureSection } from '@/components/landing/capture-section'
import { LandingConnectionSection } from '@/components/landing/connection-section'
import { LandingPrivacySection } from '@/components/landing/privacy-section'
import { LandingFinalCtaSection } from '@/components/landing/final-cta-section'
import { LandingFooter } from '@/components/landing/footer'

export function ThenvueLandingPage({ user }: { user?: boolean }) {
  return (
    <div className="landing-root-container">
      {/* 1. Minimal Navigation */}
      <LandingNavbar user={user} />

      <main className="landing-main-flow">
        {/* 2. Hero: "Your life, remembered." */}
        <LandingHero user={user} />

        {/* 3. Emotional Problem: "You won't remember this." */}
        <LandingEmotionalProblem />

        {/* 4. The Aha Moment: "Ask your past anything." */}
        <LandingAhaMoment />

        {/* 5. Rediscover Section: "Find moments you forgot." */}
        <LandingRediscoverSection />

        {/* 6. Capture Section: "Don't wait until it's important." */}
        <LandingCaptureSection />

        {/* 7. Connection Section: "Your memories are connected." */}
        <LandingConnectionSection />

        {/* 8. Privacy: "Your memories aren't content." */}
        <LandingPrivacySection />

        {/* 9. Final CTA: "Start remembering." */}
        <LandingFinalCtaSection user={user} />
      </main>

      {/* 10. Clean Minimal Footer */}
      <LandingFooter />
    </div>
  )
}
