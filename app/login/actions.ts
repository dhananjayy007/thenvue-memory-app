'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error: string | null; message: string | null }

export async function authenticate(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const mode = String(formData.get('mode') ?? 'sign-in')
  if (mode === 'sign-up') {
    return signUp(_prev, formData)
  }
  return signIn(_prev, formData)
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Email and password are required.', message: null }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message, message: null }

  redirect('/app')
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const name = String(formData.get('name') ?? '').trim()

  if (!email || !password) return { error: 'Email and password are required.', message: null }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name || null } },
  })

  if (error) return { error: error.message, message: null }

  if (!data.session) {
    return { error: null, message: 'Check your email to confirm your account, then sign in.' }
  }

  redirect('/app')
}


export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
