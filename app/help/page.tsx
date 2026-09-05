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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Creating your first memory',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To capture a memory, open your space and tap the "Capture" button or the quick prompt at the top of your timeline. Type your reflection naturally in your own words. Thenvue organizes your entry into your chronological timeline.',
      },
    },
    {
      '@type': 'Question',
      name: 'Text, photos, and voice notes',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can write journal entries directly, attach photos to preserve visual moments, or tap the microphone to record voice notes with automated transcription.',
      },
    },
    {
      '@type': 'Question',
      name: 'Asking Thenvue a question',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Navigate to the "Ask" tab, type any question (e.g., "What did I do last summer?"), and Thenvue searches your saved memories for relevant context to generate an answer summary.',
      },
    },
    {
      '@type': 'Question',
      name: 'How "Ask" search works',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When you save a memory, Thenvue generates a vector embedding representation. When you ask a question, the database retrieves relevant memories matching your query to synthesize a summary.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why an AI answer may be incomplete',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Thenvue can only summarize information that has been saved in your account. If a detail was not recorded, the AI will not have context to answer. Review original memory cards for complete records.',
      },
    },
    {
      '@type': 'Question',
      name: 'Deleting a memory',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When you delete an individual memory entry, its associated photo/audio files and media records are removed, while the memory record is marked as deleted and excluded from your timeline and searches.',
      },
    },
  ],
}

export default async function HelpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="landing-root-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
