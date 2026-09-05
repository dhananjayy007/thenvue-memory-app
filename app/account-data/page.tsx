import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Download, Trash2, ShieldAlert, Database } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/navbar'
import { LandingFooter } from '@/components/landing/footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Thenvue Account & Data — Managing your data.',
  description:
    'Learn how you can manage your personal memories, delete individual entries, or request account removal.',
  alternates: {
    canonical: '/account-data',
  },
}

export default async function AccountDataPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="landing-root-container">
      <LandingNavbar user={Boolean(user)} />

      <main className="trust-page-container">
        <header className="trust-hero">
          <span className="landing-quiet-eyebrow">Data Control</span>
          <h1 className="trust-title">Your data. Your choice.</h1>
          <p className="trust-subhead">
            How you can view, manage, and delete your memories in Thenvue.
          </p>
        </header>

        {/* Feature Cards Grid */}
        <div className="account-data-grid">
          {/* Card 1: Managing & Viewing Data */}
          <div className="account-data-card">
            <div className="account-data-icon-wrap">
              <Download size={20} />
            </div>
            <h2>Accessing Your Memories</h2>
            <p>
              Your journal reflections, dates, locations, people tags, and media belong to you.
            </p>
            <p className="account-data-subtext">
              You can view, search, and copy any of your saved memories directly from your timeline at any time. For questions regarding your account data, you can email us at <a href="mailto:thenvue@gmail.com" className="trust-inline-link">thenvue@gmail.com</a>.
            </p>
          </div>

          {/* Card 2: Deleting Individual Memories */}
          <div className="account-data-card">
            <div className="account-data-icon-wrap">
              <Trash2 size={20} />
            </div>
            <h2>Deleting Individual Memories</h2>
            <p>
              You can delete any memory at any time directly from the app interface:
            </p>
            <ul>
              <li>Open any memory card on your timeline.</li>
              <li>Tap the menu or delete option and confirm.</li>
              <li>Its associated photo/audio files and media records are removed, while the memory record is marked as deleted and excluded from your timeline and searches.</li>
            </ul>
          </div>

          {/* Card 3: Account Deletion */}
          <div className="account-data-card">
            <div className="account-data-icon-wrap danger">
              <ShieldAlert size={20} />
            </div>
            <h2>Deleting Your Account</h2>
            <p>
              If you wish to close your account, we support account removal upon request.
            </p>
            <p>
              To request account deletion, email <a href="mailto:thenvue@gmail.com" className="trust-inline-link">thenvue@gmail.com</a> from your registered account email. We will process the request manually.
            </p>
          </div>

          {/* Card 4: What Happens to Deleted Data */}
          <div className="account-data-card">
            <div className="account-data-icon-wrap">
              <Database size={20} />
            </div>
            <h2>What Happens When Content Is Deleted?</h2>
            <p>
              When a memory or account is deleted:
            </p>
            <ul>
              <li>The deleted memory records and associated search indexes are removed from the active database.</li>
              <li>When an account is deleted upon request, the user authentication record and associated memories are removed.</li>
            </ul>
          </div>
        </div>

        {/* Action Callout */}
        <div className="trust-help-banner">
          <div>
            <h3>Need assistance with your account?</h3>
            <p>Our team is available to help with account questions or deletion requests.</p>
          </div>
          <Link href="/contact" className="trust-primary-btn">
            <span>Contact Support</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
