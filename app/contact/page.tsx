import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageSquare, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingFooter } from '@/components/landing/footer'
import { ContactForm } from '@/components/trust/contact-form'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Contact Thenvue — Let\'s talk.',
  description:
    'Questions, feedback, bugs, ideas, or privacy inquiries—we would love to hear from you.',
  alternates: {
    canonical: '/contact',
  },
}

const contactJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Thenvue',
  url: 'https://thenvue.com',
  email: 'thenvue@gmail.com',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'thenvue@gmail.com',
    contactType: 'customer support',
    availableLanguage: ['English'],
  },
}

export default async function ContactPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="landing-root-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <LandingNavbar user={Boolean(user)} />

      <main className="trust-page-container contact-page-layout">
        <header className="trust-hero">
          <span className="landing-quiet-eyebrow">Get in Touch</span>
          <h1 className="trust-title">Let&apos;s talk.</h1>
          <p className="trust-subhead">
            Questions, feedback, bugs, ideas—or just want to say hello? We&apos;d love to hear from you.
          </p>
        </header>

        <div className="contact-main-grid">
          {/* Interactive Form */}
          <div className="contact-form-container">
            <div className="contact-form-header">
              <h2>Send us a message</h2>
              <p>You can send a note below or email us directly at <a href="mailto:thenvue@gmail.com" className="trust-inline-link">thenvue@gmail.com</a>.</p>
            </div>
            <ContactForm />
          </div>

          {/* Direct Channels Sidebar */}
          <aside className="contact-channels-sidebar">
            <div className="contact-channel-card">
              <div className="channel-icon-wrap">
                <Mail size={18} />
              </div>
              <div className="channel-info">
                <h3>General Support</h3>
                <p>For questions about using Thenvue or your account.</p>
                <a href="mailto:thenvue@gmail.com" className="channel-link">
                  thenvue@gmail.com
                </a>
              </div>
            </div>

            <div className="contact-channel-card">
              <div className="channel-icon-wrap privacy">
                <ShieldAlert size={18} />
              </div>
              <div className="channel-info">
                <h3>Privacy & Account Inquiries</h3>
                <p>For account deletion or privacy-related questions.</p>
                <a href="mailto:thenvue@gmail.com" className="channel-link">
                  thenvue@gmail.com
                </a>
              </div>
            </div>

            <div className="contact-channel-card">
              <div className="channel-icon-wrap">
                <HelpCircle size={18} />
              </div>
              <div className="channel-info">
                <h3>Self-Service Help</h3>
                <p>Browse guides on capturing, searching, and managing memories.</p>
                <Link href="/help" className="channel-link">
                  Visit Help Center →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
