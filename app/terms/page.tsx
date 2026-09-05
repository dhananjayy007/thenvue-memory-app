import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingFooter } from '@/components/landing/footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Thenvue Terms of Service — The simple rules.',
  description:
    'These terms explain how Thenvue works, what you can expect from us, and what we expect from you as a user of our service.',
  alternates: {
    canonical: '/terms',
  },
}

export default async function TermsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const lastUpdated = 'September 5, 2026'

  return (
    <div className="landing-root-container">
      <LandingNavbar user={Boolean(user)} />

      <main className="trust-page-container">
        {/* Header Hero */}
        <header className="trust-hero">
          <span className="landing-quiet-eyebrow">User Agreement</span>
          <h1 className="trust-title">The simple rules.</h1>
          <p className="trust-subhead">
            These terms explain how Thenvue works, what you can expect from us, and what we expect from you.
          </p>
          <div className="trust-meta-row">
            <span className="trust-badge">
              <FileText size={12} /> Standard Terms
            </span>
            <span className="trust-date">Last updated: {lastUpdated}</span>
          </div>
        </header>

        {/* Content Body */}
        <article className="trust-article-body">
          <section className="trust-section" id="acceptance">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Thenvue (including our web application at thenvue.com, mobile applications, and associated APIs), 
              you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;) and our <Link href="/privacy" className="trust-inline-link">Privacy Policy</Link>. 
              If you do not agree to these Terms, please do not use the service.
            </p>
          </section>

          <section className="trust-section" id="eligibility">
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 13 years old (or the minimum legal age in your jurisdiction) to create an account or use Thenvue. 
              By using Thenvue, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
            </p>
          </section>

          <section className="trust-section" id="account">
            <h2>3. Your Account and Security</h2>
            <p>
              When you create an account, you must provide accurate, current information. You are responsible for safeguarding your login credentials 
              and for all activities that occur under your account. You must notify us immediately if you suspect any unauthorized access to your space.
            </p>
          </section>

          <section className="trust-section" id="content-ownership">
            <h2>4. Your Memories and Content Ownership</h2>
            <p>
              <strong>You own your content.</strong> We claim no intellectual property rights over the notes, photos, audio voice recordings, or metadata 
              you upload or record on Thenvue.
            </p>
            <p>
              In order for us to provide the service, you grant Thenvue a limited, non-exclusive, worldwide license solely to host, store, replicate, 
              generate embeddings for, transcribe, and display your content strictly within your account and to authorized collaborators with whom you choose to share.
            </p>
          </section>

          <section className="trust-section" id="acceptable-use">
            <h2>5. Acceptable Use Policy</h2>
            <p>Thenvue is designed for peaceful personal journaling and memory preservation. You agree not to:</p>
            <ul>
              <li>Use the service for any illegal, harmful, threatening, abusive, or infringing purpose.</li>
              <li>Upload malicious software, viruses, or harmful code designed to interrupt or damage Thenvue infrastructure.</li>
              <li>Attempt to bypass authentication, probe security vulnerabilities, or access other users&apos; accounts or data.</li>
              <li>Scrape, reverse-engineer, decompile, or copy the underlying algorithms, interface designs, or software without written permission.</li>
              <li>Use Thenvue to generate unsolicited commercial communications or spam.</li>
            </ul>
          </section>

          <section className="trust-section" id="ai-information">
            <h2>6. AI-Generated Information & Reflections</h2>
            <p>
              Thenvue provides artificial intelligence features—such as automatic contextual tagging, speech transcription, and conversational 
              recollections (&ldquo;Ask Your Life&rdquo;).
            </p>
            <div className="trust-warning-box">
              <AlertCircle size={16} className="trust-warning-icon" />
              <div>
                <strong>Important Notice on AI Output:</strong>
                <p>
                  AI-generated answers and reflections are probabilistic summaries created from your saved entries. While designed to be strictly grounded, 
                  AI models can occasionally misunderstand context, misinterpret nuances, or produce incomplete summaries. Thenvue is not an infallible legal 
                  or medical record, and its AI responses should not be relied upon for professional, medical, or legal advice.
                </p>
              </div>
            </div>
          </section>

          <section className="trust-section" id="intellectual-property">
            <h2>7. Thenvue Intellectual Property</h2>
            <p>
              The Thenvue application, including all software code, interface design, brand identity, logos, visual graphics, animations, and documentation, 
              is the exclusive property of Thenvue and protected by applicable copyright, trademark, and intellectual property laws.
            </p>
          </section>

          <section className="trust-section" id="availability">
            <h2>8. Service Availability & Maintenance</h2>
            <p>
              We strive to maintain continuous, dependable service with high uptime. However, Thenvue may occasionally experience temporary downtime, 
              scheduled maintenance, or unexpected interruptions. We provide the service on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis 
              without warranties of uninterrupted performance.
            </p>
          </section>

          <section className="trust-section" id="termination">
            <h2>9. Account Termination & Deletion</h2>
            <p>
              You may terminate your account and delete all associated data at any time via the <Link href="/account-data" className="trust-inline-link">Account & Data</Link> page. 
              We reserve the right to suspend or terminate accounts that violate these Terms or present security risks to the platform.
            </p>
          </section>

          <section className="trust-section" id="disclaimers">
            <h2>10. Disclaimers</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THENVUE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES 
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE 
              OR THAT ANY CONTENT STORED WILL BE COMPLETELY SECURE FROM UNFORESEEN HARDWARE FAILURES.
            </p>
          </section>

          <section className="trust-section" id="limitation-liability">
            <h2>11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL THENVUE, ITS FOUNDERS, EMPLOYEERS, OR INFRASTRUCTURE PARTNERS BE LIABLE FOR 
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, PROFITS, OR GOODWILL, ARISING OUT OF OR 
              CONNECTED WITH YOUR USE OF OR INABILITY TO USE THE SERVICE.
            </p>
          </section>

          <section className="trust-section" id="governing-law">
            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws applicable to online web services, 
              without regard to conflict of law principles.
            </p>
          </section>

          <section className="trust-section" id="contact">
            <h2>13. Contact Information</h2>
            <p>
              For questions regarding these Terms, please contact us:
            </p>
            <p>
              Email: <a href="mailto:thenvue@gmail.com" className="trust-inline-link">thenvue@gmail.com</a><br />
              Online: <Link href="/contact" className="trust-inline-link">thenvue.com/contact</Link>
            </p>
          </section>
        </article>

        {/* Bottom Navigation CTA */}
        <div className="trust-bottom-nav">
          <div className="trust-next-card">
            <span>Next document</span>
            <h3>Privacy Policy</h3>
            <p>Learn how your personal journal entries and data are handled.</p>
            <Link href="/privacy" className="trust-action-link">
              Read Privacy Policy <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
