import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, HelpCircle, MessageSquare } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingFooter } from '@/components/landing/footer'
import { HelpCenter } from '@/components/trust/help-center'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Thenvue Help & Support — How can we help?',
  description:
    'Everything you need to get the most out of Thenvue. Explore guides on capturing memories, using AI recall, and managing your account.',
  alternates: {
    canonical: '/help',
  },
}

export default async function HelpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="landing-root-container">
      <LandingNavbar user={Boolean(user)} />

      <main className="trust-page-container">
        <header className="trust-hero">
          <span className="landing-quiet-eyebrow">Knowledge & Guides</span>
          <h1 className="trust-title">How can we help?</h1>
          <p className="trust-subhead">
            Everything you need to get the most out of Thenvue.
          </p>
        </header>

        {/* Interactive Searchable Help System */}
        <HelpCenter />

        {/* Fallback Support CTA Card */}
        <div className="help-support-cta-banner">
          <div className="help-support-info">
            <h3>Didn&apos;t find what you were looking for?</h3>
            <p>Our team is here to help with bugs, setup questions, or personal data requests.</p>
          </div>
          <Link href="/contact" className="help-support-btn">
            <span>Contact us</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
