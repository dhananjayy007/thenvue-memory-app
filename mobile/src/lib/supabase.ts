import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lfojpnozmhhauyiulsrk.supabase.co'
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XdNTz2f20sP2kO3rYM0bQw_4oM_V_li'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
