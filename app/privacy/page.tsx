import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Lock, EyeOff, Server } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingFooter } from '@/components/landing/footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Thenvue Privacy Policy — Your memories belong to you.',
  description:
    'Here is what information Thenvue collects, how it is used, and the choices you have regarding your account.',
  alternates: {
    canonical: '/privacy',
  },
}

export default async function PrivacyPage() {
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
          <span className="landing-quiet-eyebrow">Privacy & Principles</span>
          <h1 className="trust-title">Your memories belong to you.</h1>
          <p className="trust-subhead">
            Here is what information Thenvue collects, how it is used to operate the service, and how your account is handled.
          </p>
          <div className="trust-meta-row">
            <span className="trust-badge">
              <Lock size={12} /> Account Isolation
            </span>
            <span className="trust-date">Last updated: {lastUpdated}</span>
          </div>
        </header>

        {/* Core Principles Callout */}
        <section className="trust-callout-grid">
          <div className="trust-callout-card">
            <ShieldCheck size={20} className="trust-callout-icon" />
            <h3>No Data Selling</h3>
            <p>We do not sell, rent, or trade your journal entries, photos, or voice notes to advertisers or data brokers.</p>
          </div>
          <div className="trust-callout-card">
            <EyeOff size={20} className="trust-callout-icon" />
            <h3>No Public Feed</h3>
            <p>Your timeline is private to your account. There are no public follower counts, algorithmic feeds, or social tracking.</p>
          </div>
          <div className="trust-callout-card">
            <Server size={20} className="trust-callout-icon" />
            <h3>Database Isolation</h3>
            <p>Database queries are scoped to your authenticated account ID using database security rules.</p>
          </div>
        </section>

        {/* Content Body */}
        <article className="trust-article-body">
          <section className="trust-section" id="introduction">
            <h2>1. Introduction</h2>
            <p>
              Thenvue (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is a personal memory journaling application. 
              This Privacy Policy explains what information we collect when you use Thenvue, how that data is stored and processed to provide app features, and how you can manage your data.
            </p>
          </section>

          <section className="trust-section" id="information-collected">
            <h2>2. Information We Collect</h2>
            <p>We collect information you provide directly and data necessary to run the application:</p>

            <h3>A. Account Information</h3>
            <ul>
              <li><strong>Authentication:</strong> Account email, user UUID, and authentication credentials managed by Supabase Auth.</li>
              <li><strong>Profile information:</strong> Optional display name used within the application.</li>
            </ul>

            <h3>B. Memories & Content You Save</h3>
            <ul>
              <li><strong>Written entries:</strong> Notes, journal reflections, titles, and text entries you submit.</li>
              <li><strong>Photos:</strong> Images you attach to your memory entries.</li>
              <li><strong>Voice recordings:</strong> Audio notes recorded through the app and their generated text transcripts.</li>
              <li><strong>Contextual metadata:</strong> Dates, timestamps, locations you add or select, people tagged, and tags you create.</li>
              <li><strong>Shared entries:</strong> If you choose to share a memory via a link or collaboration, the content and contributions are visible to recipients of that link.</li>
            </ul>

            <h3>C. Technical Information</h3>
            <ul>
              <li><strong>Usage & diagnostics:</strong> Standard web request information (such as browser type and screen size) to render the application properly.</li>
            </ul>
          </section>

          <section className="trust-section" id="how-we-use-information">
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to provide and improve Thenvue features:</p>
            <ul>
              <li><strong>Timeline display:</strong> Organizing, sorting, and displaying your memories chronologically.</li>
              <li><strong>Search & recall:</strong> Generating search indexes and vectors from your notes so you can search your past entries.</li>
              <li><strong>AI summarization:</strong> Retrieving relevant entries to answer queries you enter in the &ldquo;Ask&rdquo; search interface.</li>
              <li><strong>Rediscover:</strong> Surfacing memories from past dates or anniversaries.</li>
              <li><strong>Account management:</strong> Authenticating your sessions and managing your preferences.</li>
            </ul>
          </section>

          <section className="trust-section" id="ai-processing">
            <h2>4. AI Processing</h2>
            <p>
              Thenvue uses AI services (such as Google Gemini) to provide search indexing, audio transcription, and conversational retrieval:
            </p>
            <ul>
              <li><strong>Transcripts:</strong> Audio recordings are sent to AI speech services to generate text transcripts.</li>
              <li><strong>Search indexing:</strong> Text entries are converted into vector representations to power semantic search across your personal notes.</li>
              <li><strong>Query responses:</strong> When you ask a question in the search interface, the app retrieves matching snippets from your saved entries to synthesize a response.</li>
              <li><strong>Model training:</strong> We do not use your personal memories to train public AI models.</li>
            </ul>
          </section>

          <section className="trust-section" id="third-party-services">
            <h2>5. Service Providers</h2>
            <p>We rely on third-party service providers to host and operate Thenvue:</p>
            <ul>
              <li><strong>Supabase:</strong> Database hosting, user authentication, and media storage.</li>
              <li><strong>Google AI / Gemini:</strong> AI processing for embeddings, transcription, and summarization.</li>
              <li><strong>Vercel:</strong> Web application hosting and deployment.</li>
            </ul>
          </section>

          <section className="trust-section" id="data-retention">
            <h2>6. Data Management & Deletion</h2>
            <p>
              You have control over the content in your account:
            </p>
            <ul>
              <li><strong>Memory deletion:</strong> When you delete a memory, its associated photo/audio files and media records are removed, while the memory record is marked as deleted and excluded from the app.</li>
              <li><strong>Account deletion:</strong> To request account deletion, email <a href="mailto:thenvue@gmail.com" className="trust-inline-link">thenvue@gmail.com</a>. We will process the request manually.</li>
            </ul>
          </section>

          <section className="trust-section" id="security">
            <h2>7. Security</h2>
            <p>
              We take security seriously and utilize standard controls provided by our hosting and database infrastructure:
            </p>
            <ul>
              <li><strong>Access controls:</strong> Database Row-Level Security policies restrict data access to the authenticated account.</li>
              <li><strong>Encrypted transmission:</strong> All web traffic is transmitted over standard HTTPS/TLS encryption.</li>
            </ul>
          </section>

          <section className="trust-section" id="children">
            <h2>8. Children&apos;s Privacy</h2>
            <p>
              Thenvue is not directed to children under 13. We do not knowingly collect personal data from children under 13.
            </p>
          </section>

          <section className="trust-section" id="changes">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When changes are made, the updated version will be posted here with a revised effective date.
            </p>
          </section>

          <section className="trust-section" id="contact">
            <h2>10. Contact Us</h2>
            <p>
              For any questions regarding this Privacy Policy or your account, please contact us:
            </p>
            <div className="trust-contact-box">
              <p><strong>Thenvue Support</strong></p>
              <p>Email: <a href="mailto:thenvue@gmail.com" className="trust-inline-link">thenvue@gmail.com</a></p>
              <p>Contact page: <Link href="/contact" className="trust-inline-link">thenvue.com/contact</Link></p>
            </div>
          </section>
        </article>

        {/* Bottom Navigation CTA */}
        <div className="trust-bottom-nav">
          <div className="trust-next-card">
            <span>Next document</span>
            <h3>Terms of Service</h3>
            <p>Read the terms and guidelines governing the use of Thenvue.</p>
            <Link href="/terms" className="trust-action-link">
              Read Terms of Service <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
