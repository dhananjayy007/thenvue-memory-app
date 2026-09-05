import type { Metadata } from 'next'
import Link from 'next/link'
import { Mic, Sparkles, Search, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingFooter } from '@/components/landing/footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Voice Journal App — Capture Your Thoughts by Voice | Thenvue',
  description:
    'Record your thoughts by voice, turn them into searchable memories, and revisit what you were thinking later with Thenvue.',
  alternates: {
    canonical: '/voice-journal',
  },
  openGraph: {
    title: 'Voice Journal App — Capture Your Thoughts by Voice | Thenvue',
    description:
      'Record your thoughts by voice, turn them into searchable memories, and revisit what you were thinking later with Thenvue.',
    url: 'https://thenvue.com/voice-journal',
  },
}

export default async function VoiceJournalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="landing-root-container">
      <LandingNavbar user={Boolean(user)} />

      <main className="trust-page-container">
        <header className="trust-hero">
          <span className="landing-quiet-eyebrow">Voice Journal</span>
          <h1 className="trust-title">Capture your life as you speak.</h1>
          <p className="trust-subhead">
            Sometimes you don&apos;t want to type your memory. Just say it. Thenvue turns your spoken words into searchable memories on your timeline.
          </p>
        </header>

        {/* Workflow overview */}
        <section className="ai-flow-diagram-card" aria-label="Voice journal workflow">
          <span className="ai-flow-title">The Spoken Memory Workflow</span>
          <div className="ai-flow-steps">
            <div className="ai-flow-step">
              <span className="step-badge">1. Record</span>
              <strong>Spoken Note</strong>
              <p>Tap microphone to capture</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step highlight">
              <span className="step-badge">2. Transcribe</span>
              <strong>Text Transcript</strong>
              <p>Automated speech-to-text</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step">
              <span className="step-badge">3. Timeline</span>
              <strong>Organized Entry</strong>
              <p>Date, place, and tags</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step">
              <span className="step-badge">4. Search</span>
              <strong>Natural Recall</strong>
              <p>Find past spoken thoughts</p>
            </div>
          </div>
        </section>

        {/* Editorial Body Content */}
        <article className="trust-article-body">
          <section className="trust-section">
            <h2>Why Journal by Voice?</h2>
            <p>
              Writing isn&apos;t always practical when you are on a walk, driving home, or processing a full day of events. Speaking aloud allows you to capture nuances, unfiltered feelings, and detailed observations before they fade.
            </p>
            <p>
              Traditional voice memo apps leave you with dozens of unnamed audio files you never listen to again. Thenvue bridges audio and text so your spoken memories remain searchable and connected to your timeline.
            </p>
          </section>

          <section className="trust-section">
            <h2>How Voice Capture Works in Thenvue</h2>
            <p>
              Thenvue integrates voice recording directly into the memory capture flow:
            </p>
            <ul className="trust-list">
              <li>
                <strong>One-tap audio capture:</strong> Tap the microphone in your memory composer to record spoken reflections, conversations you want to preserve, or spontaneous ideas.
              </li>
              <li>
                <strong>Automated transcription:</strong> Audio is processed to produce readable text transcripts alongside your original recording.
              </li>
              <li>
                <strong>Contextual metadata:</strong> Attach locations, timestamps, people, or tags so your spoken entry fits into your life story.
              </li>
              <li>
                <strong>Searchable archives:</strong> Because your voice notes are transcribed, they are indexed for keyword search and natural language queries through <Link href="/ai-memory-search" className="trust-inline-link">AI Memory Search</Link>.
              </li>
            </ul>
          </section>

          <section className="trust-section">
            <h2>Rediscovering What You Spoke</h2>
            <p>
              Weeks or years later, you can search your memories for specific topics, people, or feelings you spoke about. Ask Thenvue questions like <em>&ldquo;What was I thinking about on my walk last month?&rdquo;</em> and find the exact moments you recorded.
            </p>
          </section>

          <section className="trust-section">
            <h2>Privacy & Your Audio</h2>
            <p>
              Your voice recordings and transcripts are private to your account, protected by row-level database security. We do not sell your personal recordings or transcripts to data brokers. Read our <Link href="/privacy" className="trust-inline-link">Privacy Policy</Link> and <Link href="/ai-data" className="trust-inline-link">AI & Data Transparency</Link> page for full details on how data is handled.
            </p>
          </section>

          {/* Related guides / Internal Links */}
          <div className="trust-crosslinks-banner">
            <h3>Explore More</h3>
            <div className="trust-crosslinks-grid">
              <Link href="/ai-memory-search" className="trust-crosslink-card">
                <Search size={16} />
                <div>
                  <strong>AI Memory Search</strong>
                  <p>Learn how to query your past using natural language.</p>
                </div>
              </Link>
              <Link href="/help" className="trust-crosslink-card">
                <Clock size={16} />
                <div>
                  <strong>Help & Guides</strong>
                  <p>Read step-by-step instructions for getting started.</p>
                </div>
              </Link>
            </div>
          </div>
        </article>

        {/* CTA */}
        <div className="help-support-cta-banner">
          <div className="help-support-info">
            <h3>Ready to start preserving your thoughts?</h3>
            <p>Create your private space and start capturing your moments today.</p>
          </div>
          <Link href={user ? '/app' : '/login'} className="help-support-btn">
            <span>{user ? 'Open Thenvue' : 'Get Started'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
