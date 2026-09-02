'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'
import { RefreshCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

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
        500
      </h1>
      <h2 style={{
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        fontWeight: 'normal',
        margin: '0 0 24px',
        color: 'var(--muted-foreground)'
      }}>
        A memory lapse occurred
      </h2>
      <p style={{
        fontSize: '15px',
        maxWidth: '400px',
        color: 'var(--muted-foreground)',
        lineHeight: 1.6,
        margin: '0 0 32px'
      }}>
        Something went wrong while trying to access this page. We're working on recalling what happened.
      </p>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => reset()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'background 0.2s'
          }}
        >
          <RefreshCcw size={16} />
          Try again
        </button>
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
          Return home
        </Link>
      </div>
    </div>
  )
}
