'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, X, Sparkles, BookOpen, Compass, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react'

interface HelpArticle {
  id: string
  category: 'getting-started' | 'memories' | 'ai-recall' | 'account' | 'privacy'
  title: string
  description: string
  content: string[]
}

const HELP_ARTICLES: HelpArticle[] = [
  // Getting Started
  {
    id: 'first-memory',
    category: 'getting-started',
    title: 'Creating your first memory',
    description: 'How to quickly capture a thought, daily reflection, or milestone.',
    content: [
      'To capture a memory, open your space and tap the "Capture" button or the quick prompt at the top of your timeline.',
      'Type your reflection naturally in your own words. You do not need to worry about rigid formatting.',
      'Thenvue helps organize your entry into your chronological timeline.'
    ],
  },
  {
    id: 'capture-methods',
    category: 'getting-started',
    title: 'Text, photos, and voice notes',
    description: 'Learn the ways to preserve moments in Thenvue.',
    content: [
      'Write: Type your journal entries, quotes, or reflections directly.',
      'Photo: Attach photos to your entries to preserve visual memories.',
      'Voice: Tap the microphone icon to record voice notes. Thenvue generates text transcripts from your audio so you can read and search them later.'
    ],
  },
  {
    id: 'asking-question',
    category: 'getting-started',
    title: 'Asking Thenvue a question',
    description: 'Using the "Ask" search to query your past moments.',
    content: [
      'Navigate to the "Ask" tab in the navigation bar.',
      'Type any question, such as "What did I do last summer?" or "When was the last time I went on a trip?".',
      'Thenvue searches your saved entries for relevant context and generates a summary based on your notes.'
    ],
  },

  // Memories
  {
    id: 'editing-memory',
    category: 'memories',
    title: 'Editing a memory',
    description: 'How to update titles, notes, dates, or tags on existing entries.',
    content: [
      'Click on any memory card or timeline entry to open its full detail view.',
      'Click the edit button to modify the text, adjust the date or time, or update tags.',
      'Save your changes to update your timeline entry.'
    ],
  },
  {
    id: 'deleting-memory',
    category: 'memories',
    title: 'Deleting a memory',
    description: 'What happens when you delete an individual memory entry.',
    content: [
      'Open the memory detail modal and choose the delete option.',
      'Confirm the deletion in the prompt.',
      'Its associated photo/audio files and media records are removed, while the memory record is marked as deleted and excluded from your timeline and searches.'
    ],
  },
  {
    id: 'rediscover-feature',
    category: 'memories',
    title: 'Rediscover & past reflections',
    description: 'How Thenvue surfaces moments from your past.',
    content: [
      'The Rediscover view highlights memories from past dates and anniversaries.',
      'You can browse historical entries and reflect on earlier moments in your timeline.'
    ],
  },
  {
    id: 'perspectives-collab',
    category: 'memories',
    title: 'Shared memories & perspectives',
    description: 'Share memories or view contributions on shared moments.',
    content: [
      'Memories can be shared with collaborators using a share link or by mentioning collaborators.',
      'Shared contributors can view the memory and add their own perspective.',
      'Perspectives appear alongside the memory entry.'
    ],
  },

  // AI & Recall
  {
    id: 'how-ask-works',
    category: 'ai-recall',
    title: 'How "Ask" search works',
    description: 'Understanding vector search and summary generation.',
    content: [
      'When you save a memory, Thenvue generates a vector embedding representation for search.',
      'When you ask a question, the database retrieves relevant memories matching your query.',
      'Matching entries are used to synthesize a summary answering your question.'
    ],
  },
  {
    id: 'why-ai-incomplete',
    category: 'ai-recall',
    title: 'Why an AI answer may be incomplete',
    description: 'Understanding the boundaries and limitations of memory search.',
    content: [
      'Thenvue can only summarize information that has been saved in your account. If a detail was not recorded, the AI will not have context to answer.',
      'AI responses are summaries based on retrieved notes. We recommend reviewing the original memory cards for complete records.'
    ],
  },

  // Account
  {
    id: 'account-security',
    category: 'account',
    title: 'Managing account and security',
    description: 'Sign-in methods and account access.',
    content: [
      'Thenvue uses Supabase Auth for user authentication.',
      'You can access your space across devices by logging into your account.'
    ],
  },
  {
    id: 'data-export',
    category: 'account',
    title: 'Accessing your personal data',
    description: 'How to view and copy your memories.',
    content: [
      'Your memory entries and reflections belong to you. You can view, edit, and copy any entry from your timeline.',
      'For data or account assistance, contact us at thenvue@gmail.com.'
    ],
  },

  // Privacy
  {
    id: 'how-stored',
    category: 'privacy',
    title: 'How your memories are stored',
    description: 'Database isolation and Row-Level Security explanation.',
    content: [
      'Memories are protected by PostgreSQL Row-Level Security policies.',
      'This ensures database queries are scoped strictly to your authenticated account ID.'
    ],
  },
  {
    id: 'ai-data-boundaries',
    category: 'privacy',
    title: 'AI and your data privacy',
    description: 'How AI services interact with your notes.',
    content: [
      'We do not use your private personal memories to train public AI models.',
      'AI APIs are used solely to process embeddings, audio transcription, and answers to your queries.'
    ],
  },
]

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)

  const categories = [
    { id: 'all', label: 'All Guides' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'memories', label: 'Memories & Media' },
    { id: 'ai-recall', label: 'AI & Recall' },
    { id: 'account', label: 'Account' },
    { id: 'privacy', label: 'Privacy & Security' },
  ]

  const filteredArticles = useMemo(() => {
    return HELP_ARTICLES.filter((article) => {
      const matchesCategory = activeCategory === 'all' || article.category === activeCategory
      const query = searchQuery.toLowerCase().trim()
      if (!query) return matchesCategory

      const matchesQuery =
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.content.some((c) => c.toLowerCase().includes(query))

      return matchesCategory && matchesQuery
    })
  }, [searchQuery, activeCategory])

  return (
    <div className="help-center-wrapper">
      {/* Search Bar */}
      <div className="help-search-container">
        <div className="help-search-box">
          <Search size={18} className="help-search-icon" />
          <input
            type="text"
            className="help-search-input"
            placeholder="Search guides, capturing tips, AI recall, privacy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="help-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="help-category-pills">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`help-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="help-articles-grid">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <button
              key={article.id}
              type="button"
              className="help-article-card"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="article-card-header">
                <span className="article-cat-tag">
                  {categories.find((c) => c.id === article.category)?.label}
                </span>
                <ChevronRight size={14} className="article-arrow" />
              </div>
              <h3 className="article-title">{article.title}</h3>
              <p className="article-description">{article.description}</p>
            </button>
          ))
        ) : (
          <div className="help-empty-results">
            <p>No guides found matching &ldquo;{searchQuery}&rdquo;.</p>
            <button
              type="button"
              className="help-reset-search-btn"
              onClick={() => {
                setSearchQuery('')
                setActiveCategory('all')
              }}
            >
              View all guides
            </button>
          </div>
        )}
      </div>

      {/* Article Detail Modal / Reader */}
      {selectedArticle && (
        <div className="overlay" style={{ alignItems: 'center' }} onClick={() => setSelectedArticle(null)}>
          <div className="detail-modal help-modal-reader" onClick={(e) => e.stopPropagation()}>
            <header>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="article-cat-tag">
                  {categories.find((c) => c.id === selectedArticle.category)?.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                aria-label="Close article"
              >
                <X size={18} />
              </button>
            </header>

            <article style={{ marginTop: 24 }}>
              <h2 style={{ font: '400 24px Georgia, serif', margin: '0 0 12px', color: '#f5f4f0' }}>
                {selectedArticle.title}
              </h2>
              <p style={{ color: '#9e9e98', fontSize: 14, marginBottom: 20, fontStyle: 'italic' }}>
                {selectedArticle.description}
              </p>

              <div className="help-modal-content">
                {selectedArticle.content.map((paragraph, i) => (
                  <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: '#f5f4f0', marginBottom: 14 }}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9e9e98' }}>Need more help with this?</span>
                <Link href="/contact" className="trust-inline-link" style={{ fontSize: 13 }}>
                  Contact our support team →
                </Link>
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  )
}
