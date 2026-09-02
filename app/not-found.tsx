'use client'

import Link from 'next/link'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        marginBottom: '24px',
      }}>
        <ThenvueLogo size={64} />
      </div>
      <h1 style={{
        fontFamily: 'Georgia, serif',
        fontSize: '48px',
        fontWeight: 'normal',
        margin: '0 0 16px',
        letterSpacing: '-1px'
      }}>
        404
      </h1>
      <h2 style={{
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        fontWeight: 'normal',
        margin: '0 0 24px',
        color: 'var(--muted-foreground)'
      }}>
        Memory not found
      </h2>
      <p style={{
        fontSize: '15px',
        maxWidth: '400px',
        color: 'var(--muted-foreground)',
        lineHeight: 1.6,
        margin: '0 0 32px'
      }}>
        The page you're looking for has slipped our mind, or it never existed in the first place.
      </p>
      <Link href="/app" style={{
        backgroundColor: 'var(--accent)',
        color: 'var(--accent-foreground)',
        padding: '12px 24px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '14px',
        transition: 'opacity 0.2s'
      }}>
        Return to timeline
      </Link>
    </div>
  )
}
