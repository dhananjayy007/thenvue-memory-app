'use server'

import { createClient } from '@/lib/supabase/server'

export interface JoinWaitlistResult {
  success: boolean
  savedToDb?: boolean
  error?: string
}

export async function joinWaitlistAction({
  email,
  platform = 'all',
}: {
  email: string
  platform?: string
}): Promise<JoinWaitlistResult> {
  const cleanEmail = email?.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length > 255) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const validPlatform = ['ios', 'android', 'mobile', 'all'].includes(platform) ? platform : 'all'

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('waitlist_signups')
      .insert({
        email: cleanEmail,
        platform: validPlatform,
      })

    if (error) {
      console.error('[Waitlist] Database error:', error.message, error.code)
      // Postgres unique constraint violation: already subscribed on this platform
      if (error.code === '23505') {
        return { success: true, savedToDb: true }
      }

      // If table does not exist yet (PostgREST code PGRST205)
      if (error.code === 'PGRST205' || error.message?.includes('waitlist_signups')) {
        console.error('❌ [Waitlist] Table "waitlist_signups" does not exist in Supabase. Execute supabase/waitlist_signups.sql')
        return {
          success: false,
          error: 'Waitlist table not found in Supabase. Please run supabase/waitlist_signups.sql in your Supabase SQL Editor.',
        }
      }

      return { success: false, error: 'Unable to save signup at this moment. Please try again.' }
    }

    return { success: true, savedToDb: true }
  } catch (err: any) {
    console.error('[Waitlist] Server exception:', err?.message || err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
