import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, Search, Mic, ShieldCheck, ArrowRight, BookOpen, Layers } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingFooter } from '@/components/landing/footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'AI Memory Search — Search Your Past With Thenvue',
  description:
    'Search your personal memories using natural language. Thenvue helps you find moments, people, places, and ideas across your saved memories.',
  alternates: {
    canonical: '/ai-memory-search',
  },
  openGraph: {
    title: 'AI Memory Search — Search Your Past With Thenvue',
    description:
      'Search your personal memories using natural language. Thenvue helps you find moments, people, places, and ideas across your saved memories.',
    url: 'https://thenvue.com/ai-memory-search',
  },
}

export default async function AiMemorySearchPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="landing-root-container">
      <LandingNavbar user={Boolean(user)} />

      <main className="trust-page-container">
        <header className="trust-hero">
          <span className="landing-quiet-eyebrow">Ask Your Life</span>
          <h1 className="trust-title">Instead of searching through your life, ask about it.</h1>
          <p className="trust-subhead">
            Search your past the way you remember it—by people, places, feelings, or moments—using natural language. Grounded in what you actually saved.
          </p>
        </header>

        {/* Workflow Diagram */}
        <section className="ai-flow-diagram-card" aria-label="AI memory search workflow">
          <span className="ai-flow-title">How Memory Search Works</span>
          <div className="ai-flow-steps">
            <div className="ai-flow-step">
              <span className="step-badge">1. Query</span>
              <strong>Natural Question</strong>
              <p>&ldquo;When was I in Kyoto?&rdquo;</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step highlight">
              <span className="step-badge">2. Match</span>
              <strong>Vector Similarity</strong>
              <p>Finds relevant memories</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step">
              <span className="step-badge">3. Synthesize</span>
              <strong>Grounded Answer</strong>
              <p>Summary built from your notes</p>
            </div>
            <div className="ai-flow-arrow">→</div>

            <div className="ai-flow-step">
              <span className="step-badge">4. Verify</span>
              <strong>Direct Cards</strong>
              <p>Jump to original entries</p>
            </div>
          </div>
        </section>

        {/* Article Body */}
        <article className="trust-article-body">
          <section className="trust-section">
            <h2>Beyond Exact Keyword Search</h2>
            <p>
              Traditional journals require you to remember the exact keyword you typed years ago. If you wrote <em>&ldquo;strolled along the canal&rdquo;</em>, a search for <em>&ldquo;river walk&rdquo;</em> would return zero results.
            </p>
            <p>
              Thenvue uses semantic vector search to understand the meaning behind your memories. You can search conceptually:
            </p>
            <ul className="trust-list">
              <li>&ldquo;Books I enjoyed reading last autumn&rdquo;</li>
              <li>&ldquo;Conversations about moving to a new apartment&rdquo;</li>
              <li>&ldquo;Restaurants I visited with Maya in Mumbai&rdquo;</li>
              <li>&ldquo;How I felt before starting my new project&rdquo;</li>
            </ul>
          </section>

          <section className="trust-section">
            <h2>How the &ldquo;Ask&rdquo; Feature Works</h2>
            <p>
              When you submit a question in Thenvue&apos;s Ask tab:
            </p>
            <ol className="trust-list">
              <li>
                <strong>Semantic embedding:</strong> Your query is converted into a vector representation.
              </li>
              <li>
                <strong>Database retrieval:</strong> Thenvue searches your private memory records in PostgreSQL using cosine distance to identify relevant moments.
              </li>
              <li>
                <strong>Grounded summary:</strong> The most relevant memories are passed as context to synthesize a concise, factual summary of what happened.
              </li>
              <li>
                <strong>Source transparency:</strong> The underlying memory cards are provided so you can click through to read your original words and see any attached photos.
              </li>
            </ol>
          </section>

          <section className="trust-section">
            <h2>Real Capabilities and Clear Boundaries</h2>
            <p>
              We believe in honest technology. Here is what AI memory search does and does not do:
            </p>
            <div className="trust-boundary-cards">
              <div className="boundary-card-item supported">
                <span className="boundary-tag">What it does</span>
                <p>Retrieves and summarizes memories you have actually recorded and saved in your space.</p>
              </div>
              <div className="boundary-card-item unsupported">
                <span className="boundary-tag">What it does not do</span>
                <p>It cannot recall moments you never recorded, guess details outside your notes, or provide perfect photographic recall.</p>
              </div>
            </div>
          </section>

          <section className="trust-section">
            <h2>Your Data & Privacy</h2>
            <p>
              Memory embeddings and queries are scoped strictly to your authenticated account using database Row-Level Security. We do not use your private personal journal entries to train public foundational AI models. For in-depth technical details, visit our <Link href="/ai-data" className="trust-inline-link">AI & Data Transparency</Link> page.
            </p>
          </section>

          {/* Crosslinks */}
          <div className="trust-crosslinks-banner">
            <h3>Related Features & Information</h3>
            <div className="trust-crosslinks-grid">
              <Link href="/voice-journal" className="trust-crosslink-card">
                <Mic size={16} />
                <div>
                  <strong>Voice Journal App</strong>
                  <p>Learn how spoken thoughts become searchable memories.</p>
                </div>
              </Link>
              <Link href="/ai-data" className="trust-crosslink-card">
                <Layers size={16} />
                <div>
                  <strong>AI & Data Architecture</strong>
                  <p>Read how data is processed, indexed, and isolated.</p>
                </div>
              </Link>
              <Link href="/help" className="trust-crosslink-card">
                <BookOpen size={16} />
                <div>
                  <strong>Help Center</strong>
                  <p>Explore frequently asked questions about Ask search.</p>
                </div>
              </Link>
            </div>
          </div>
        </article>

        {/* Support / CTA Banner */}
        <div className="help-support-cta-banner">
          <div className="help-support-info">
            <h3>Experience memory search firsthand</h3>
            <p>Start recording your days and search your timeline naturally.</p>
          </div>
          <Link href={user ? '/app' : '/login'} className="help-support-btn">
            <span>{user ? 'Open Thenvue' : 'Try Thenvue'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
