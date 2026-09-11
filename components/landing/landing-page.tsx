'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingHero } from '@/components/landing/hero'
import { LandingEmotionalProblem } from '@/components/landing/emotional-problem'
import { LandingAhaMoment } from '@/components/landing/aha-moment'
import { LandingRediscoverSection } from '@/components/landing/rediscover-section'
import { LandingSharedMemoriesSection } from '@/components/landing/shared-memories-section'
import { LandingCaptureSection } from '@/components/landing/capture-section'
import { LandingConnectionSection } from '@/components/landing/connection-section'
import { LandingPrivacySection } from '@/components/landing/privacy-section'
import { LandingFinalCtaSection } from '@/components/landing/final-cta-section'
import { LandingFooter } from '@/components/landing/footer'
import { TornDivider } from '@/components/landing/torn-divider'

export function ThenvueLandingPage({ user }: { user?: boolean }) {
  const router = useRouter()

  useEffect(() => {
    // If inside Capacitor / native app wrapper, route directly to /app
    const isCapacitor =
      typeof window !== 'undefined' &&
      Boolean(
        (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
      )

    if (isCapacitor) {
      router.replace('/app')
    }
  }, [router])

  return (
    <div className="landing-root-container">
      {/* 1. Minimal Editorial Navigation */}
      <LandingNavbar user={user} />

      <main className="landing-main-flow">
        {/* 2. Hero: Writing-first Keepsake Journal Card */}
        <LandingHero user={user} />

        {/* Tactile Torn Paper Divider */}
        <TornDivider fillColor="var(--landing-torn-fill)" bgFill="var(--landing-torn-bg)" />

        {/* 3. Emotional Problem: "You won't remember this." */}
        <LandingEmotionalProblem />

        {/* 4. The Aha Moment: "Ask your past anything." */}
        <LandingAhaMoment />

        {/* Tactile Torn Paper Divider */}
        <TornDivider fillColor="var(--landing-torn-bg)" bgFill="var(--landing-torn-fill)" />

        {/* 5. Rediscover: "Bring your old photos back." */}
        <LandingRediscoverSection />

        {/* 6. Shared Memories: "Some memories have more than one side." */}
        <LandingSharedMemoriesSection />

        {/* Tactile Torn Paper Divider */}
        <TornDivider fillColor="var(--landing-torn-fill)" bgFill="var(--landing-torn-bg)" />

        {/* 7. Capture: "Writing comes first. Add what you need." */}
        <LandingCaptureSection />

        {/* 8. Connection: Written thoughts connected across time */}
        <LandingConnectionSection />

        {/* 9. Privacy: "Your memories aren't content." */}
        <LandingPrivacySection />

        {/* 10. Final CTA: "Start remembering." */}
        <LandingFinalCtaSection user={user} />
      </main>

      {/* 11. Clean Minimal Footer */}
      <LandingFooter />
    </div>
  )
}
