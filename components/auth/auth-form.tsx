'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'
import { authenticate, type AuthState } from '@/app/login/actions'
import { GoogleIcon } from '@/components/icons/google-icon'
import { createClient } from '@/lib/supabase/client'

const initialState: AuthState = { error: null, message: null }

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [state, formAction] = useActionState(authenticate, initialState)
  const { pending } = useFormStatus()
  const [oauthPending, setOauthPending] = useState(false)

  const heading = mode === 'signup' ? 'Begin your archive.' : 'Welcome back.'
  const subhead =
    mode === 'signup'
      ? 'Create a secure space for your private memories.'
      : 'Sign in to your private space.'

  const isAlreadyRegisteredError =
    state?.error && state.error.toLowerCase().includes('already registered')

  const handleOAuthLogin = async (provider: 'google') => {
    setOauthPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error(error)
      setOauthPending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ThenvueLogo size={48} />
          <span style={{ font: '600 26px Georgia, serif', letterSpacing: '-0.5px' }}>
            Thenvue
          </span>
        </div>

        <h1>{heading}</h1>
        <p className="subhead">{subhead}</p>

        <div className="auth-oauth">
          <button
            type="button"
            className="auth-oauth-btn"
            onClick={() => handleOAuthLogin('google')}
            disabled={oauthPending || pending}
          >
            <GoogleIcon width={18} height={18} />
            Continue with Google
          </button>
        </div>

        <div className="auth-separator">
          <span>or continue with email</span>
        </div>

        <form action={formAction}>
          {/* Explicit mode passed to server action */}
          <input type="hidden" name="mode" value={mode} />

          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" autoComplete="name" placeholder="Your name" />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="auth-error-wrap">
              <p className="auth-error">{state.error}</p>
              {isAlreadyRegisteredError && mode === 'signup' && (
                <button
                  type="button"
                  className="auth-error-action"
                  onClick={() => setMode('login')}
                >
                  Switch to Sign in &rarr;
                </button>
              )}
            </div>
          )}
          {state?.message && <p className="auth-success">{state.message}</p>}

          <button className="auth-submit" type="submit" disabled={pending || oauthPending}>
            {pending ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
