import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSharedMemoryPublicAction } from '@/app/memories/actions'
import { Sparkles, MapPin, Calendar, Users, ArrowRight, Share2, ShieldCheck, Heart } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const memory = await getSharedMemoryPublicAction(id)

  if (!memory) {
    return {
      title: 'Shared Memory — Thenvue',
      description: 'Relive this moment together on Thenvue.',
    }
  }

  const title = `${memory.authorName} shared a memory with you: "${memory.title}"`
  const description = memory.summary || memory.body.slice(0, 160) || 'Relive this moment together and add your perspective on Thenvue.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://thenvue.com/share/${memory.id}`,
      siteName: 'Thenvue',
      images: memory.photos.length > 0 ? [memory.photos[0]] : ['https://thenvue.com/icon.svg'],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: memory.photos.length > 0 ? [memory.photos[0]] : ['https://thenvue.com/icon.svg'],
    },
  }
}

export default async function SharedMemoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memory = await getSharedMemoryPublicAction(id)

  if (!memory) {
    notFound()
  }

  const loginReturnUrl = encodeURIComponent(`/app?openMemory=${memory.id}&addPerspective=true`)

  return (
    <div className="share-page-root">
      {/* Top Navigation */}
      <header className="share-nav">
        <Link href="/" className="share-brand">
          <span className="brand-logo-circle">
            <span className="brand-leaf-icon" />
          </span>
          <span className="brand-name">Thenvue</span>
        </Link>
        <div className="share-nav-actions">
          <Link href={`/login?returnTo=${loginReturnUrl}`} className="share-signin-btn">
            Sign In
          </Link>
          <Link href={`/login?returnTo=${loginReturnUrl}`} className="landing-cta-pill share-hero-btn">
            Open App
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="share-container">
        {/* Inviter Badge */}
        <div className="share-inviter-banner">
          <div className="share-inviter-avatar">
            {memory.authorName[0]?.toUpperCase() || 'F'}
          </div>
          <div className="share-inviter-text">
            <strong>{memory.authorName}</strong> invited you to co-create this memory
          </div>
          <span className="share-collab-badge">
            <Sparkles size={13} /> Multi-Perspective
          </span>
        </div>

        {/* Memory Main Card */}
        <article className="share-card">
          {/* Photos Carousel / Grid */}
          {memory.photos.length > 0 && (
            <div className="share-photos-grid">
              {memory.photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`Memory photo ${i + 1}`}
                  className={`share-photo-item ${memory.photos.length === 1 ? 'single' : ''}`}
                />
              ))}
            </div>
          )}

          <div className="share-card-content">
            <div className="share-meta-bar">
              <span className="share-meta-item">
                <Calendar size={13} /> {memory.date}
              </span>
              {memory.place && (
                <span className="share-meta-item">
                  <MapPin size={13} /> {memory.place}
                </span>
              )}
            </div>

            <h1 className="share-title">{memory.title}</h1>

            {memory.summary && <p className="share-summary">{memory.summary}</p>}

            <div className="share-body">
              <p>{memory.body}</p>
            </div>

            {/* People & Topics */}
            {((memory.people && memory.people.length > 0) || (memory.topics && memory.topics.length > 0)) && (
              <div className="share-tags-list">
                {memory.people.map((person) => (
                  <span key={person} className="share-tag person">
                    <Users size={12} /> {person}
                  </span>
                ))}
                {memory.topics.map((topic) => (
                  <span key={topic} className="share-tag topic">
                    <CustomBrainIcon size={12} /> {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Perspective Call To Action */}
          <div className="share-perspective-cta">
            <div className="share-cta-header">
              <div className="share-cta-icon-box">
                <Sparkles size={22} />
              </div>
              <div>
                <h3>Were you there with {memory.authorName}?</h3>
                <p>Add your photos, thoughts, or voice to complete this moment together.</p>
              </div>
            </div>

            <div className="share-action-buttons">
              <Link
                href={`/login?returnTo=${loginReturnUrl}`}
                className="landing-cta-pill share-add-perspective-btn"
              >
                <span>Add My Perspective</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </article>

        {/* What is Thenvue Section */}
        <section className="share-value-prop">
          <h2>Your life, remembered for you.</h2>
          <p className="share-prop-subtitle">
            Thenvue connects all perspectives into one rich memory and creates a private, searchable AI timeline of your life.
          </p>

          <div className="share-bento-mini">
            <div className="share-bento-card">
              <Sparkles size={20} className="bento-card-icon" />
              <h4>Multiple Perspectives</h4>
              <p>Relive trips, dinners, and milestones with everyone who was there.</p>
            </div>
            <div className="share-bento-card">
              <CustomBrainIcon size={20} className="bento-card-icon" />
              <h4>Ask My Life AI</h4>
              <p>Instantly recall any detail, place, or conversation from your past.</p>
            </div>
            <div className="share-bento-card">
              <ShieldCheck size={20} className="bento-card-icon" />
              <h4>100% Private</h4>
              <p>Your memories belong to you. Zero tracking, isolated encrypted data.</p>
            </div>
          </div>

          <div className="share-download-buttons">
            <Link href="/ios" className="store-pill">
              Download for iOS
            </Link>
            <Link href="/android" className="store-pill">
              Download for Android
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="share-footer">
        <p>© 2026 Thenvue Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
