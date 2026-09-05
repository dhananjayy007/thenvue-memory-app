import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingFooter } from '@/components/landing/footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'How Thenvue Uses AI — AI & Data Transparency',
  description:
    'Learn how semantic search, vector indexing, and memory recall work in Thenvue.',
  alternates: {
    canonical: '/ai-data',
  },
}

export default async function AiDataPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="landing-root-container">
      <LandingNavbar user={Boolean(user)} />

      <main className="trust-page-container">
        <header className="trust-hero">
          <span className="landing-quiet-eyebrow">AI & Transparency</span>
          <h1 className="trust-title">How Thenvue uses AI.</h1>
          <p className="trust-subhead">
            AI helps Thenvue index and search your memories. It does not own them.
          </p>
        </header>

        {/* Visual Data Flow Diagram */}
        <section className="ai-flow-diagram-card">
          <span className="ai-flow-title">The Search & Recall Flow</span>
          <div className="ai-flow-steps">
            <div className="ai-flow-step">
              <span className="step-badge">1. Capture</span>
              <strong>Your Memory</strong>
              <p>Text, photo, or voice note</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step">
              <span className="step-badge">2. Storage</span>
              <strong>Account Scoped</strong>
              <p>Protected by Row-Level Security</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step highlight">
              <span className="step-badge">3. Index</span>
              <strong>Vector Search</strong>
              <p>Semantic embeddings</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step">
              <span className="step-badge">4. Recall</span>
              <strong>Grounded Summary</strong>
              <p>Relevant memory context</p>
            </div>
          </div>
        </section>

        {/* Core Articles Body */}
        <article className="trust-article-body">
          <section className="trust-section">
            <h2>1. What AI Does in Thenvue</h2>
            <p>
              Thenvue uses AI behind the scenes to assist with organizing and searching your notes:
            </p>

            <div className="ai-capabilities-grid">
              <div className="ai-cap-card">
                <h3>Organizing</h3>
                <p>Identifies suggested titles, dates, and locations from your entries.</p>
              </div>
              <div className="ai-cap-card">
                <h3>Indexing</h3>
                <p>Creates searchable vector representations so you can search by concept.</p>
              </div>
              <div className="ai-cap-card">
                <h3>Transcribing</h3>
                <p>Converts recorded voice notes into text.</p>
              </div>
              <div className="ai-cap-card">
                <h3>Recalling</h3>
                <p>Answers conversational search questions based on relevant entries in your timeline.</p>
              </div>
            </div>
          </section>

          <section className="trust-section">
            <h2>2. What Happens When You Ask a Question?</h2>
            <p>
              When you use the &ldquo;Ask&rdquo; search feature:
            </p>
            <ol className="trust-ordered-list">
              <li>
                <strong>Vector Search:</strong> Thenvue generates an embedding for your query and performs a vector search in the database to find entries matching your question.
              </li>
              <li>
                <strong>Context Retrieval:</strong> Relevant memory snippets belonging strictly to your user account are retrieved.
              </li>
              <li>
                <strong>Summary Generation:</strong> The retrieved notes are provided as context to generate a concise summary answering your question.
              </li>
            </ol>
          </section>

          <section className="trust-section">
            <h2>3. AI Services</h2>
            <p>
              Thenvue uses Google Gemini AI services for:
            </p>
            <ul>
              <li><strong>Semantic Embeddings:</strong> Generating vector representations for searching notes.</li>
              <li><strong>Audio Transcription:</strong> Generating text from recorded audio.</li>
              <li><strong>Question Answering:</strong> Summarizing relevant retrieved notes when you ask a question.</li>
            </ul>
          </section>

          <section className="trust-section">
            <h2>4. Model Training</h2>
            <div className="trust-callout-card" style={{ marginTop: 12, marginBottom: 18 }}>
              <ShieldCheck size={20} className="trust-callout-icon" />
              <div>
                <h3 style={{ margin: '0 0 6px', color: '#f5f4f0' }}>No Public Model Training</h3>
                <p style={{ margin: 0 }}>
                  We do not use your private journal entries, photos, or voice notes to train public AI models.
                </p>
              </div>
            </div>
          </section>

          <section className="trust-section">
            <h2>5. AI Limitations</h2>
            <div className="trust-warning-box">
              <AlertCircle size={16} className="trust-warning-icon" />
              <div>
                <strong>AI is a tool for memory assistance:</strong>
                <p>
                  AI responses are generated summaries based on retrieved notes. If information was not recorded in your account, the AI cannot know it. We recommend checking your original memory entries for complete details.
                </p>
              </div>
            </div>
          </section>

          <section className="trust-section">
            <h2>6. Related Information</h2>
            <p>
              For details on account security and data handling, please review our <Link href="/privacy" className="trust-inline-link">Privacy Policy</Link> or visit <Link href="/account-data" className="trust-inline-link">Account & Data</Link>.
            </p>
          </section>
        </article>

        {/* Bottom CTA */}
        <div className="trust-bottom-nav">
          <div className="trust-next-card">
            <span>Have questions?</span>
            <h3>We&apos;re happy to help</h3>
            <p>Get in touch with our team for questions about Thenvue.</p>
            <Link href="/contact" className="trust-action-link">
              Contact us <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
