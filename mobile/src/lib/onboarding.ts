import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

const ONBOARDING_CACHE_PREFIX = '@memory_onboarding_'
const PENDING_SYNC_PREFIX = '@memory_pending_onboarding_sync_'

/**
 * Checks onboarding completion status with public.profiles.has_completed_onboarding
 * as the authoritative server-side source of truth.
 *
 * AsyncStorage is used strictly as a startup/offline resilience cache and does not
 * override a newer server-side response when online.
 */
export async function fetchOnboardingStatus(userId: string, hasLocalMemories: boolean = false): Promise<boolean> {
  if (!userId) return true

  const cacheKey = `${ONBOARDING_CACHE_PREFIX}${userId}`
  const pendingSyncKey = `${PENDING_SYNC_PREFIX}${userId}`

  // Check if there is a pending sync from a previous offline completion
  const pendingSync = await AsyncStorage.getItem(pendingSyncKey).catch(() => null)
  if (pendingSync === 'true') {
    // Attempt background sync
    syncPendingOnboarding(userId).catch(() => {})
    return true
  }

  try {
    // Authoritative Server Check via RPC or direct select
    const { data: profile, error } = await supabase
      .rpc('get_or_create_profile')

    if (!error && profile) {
      const serverStatus = Boolean(profile.has_completed_onboarding)
      // Update local cache with authoritative server value
      await AsyncStorage.setItem(cacheKey, serverStatus ? 'true' : 'false').catch(() => {})
      return serverStatus
    }

    // Fallback direct table query if RPC is not available yet
    const { data: tableProfile, error: tableError } = await supabase
      .from('profiles')
      .select('has_completed_onboarding')
      .eq('id', userId)
      .maybeSingle()

    if (!tableError && tableProfile) {
      const serverStatus = Boolean(tableProfile.has_completed_onboarding)
      await AsyncStorage.setItem(cacheKey, serverStatus ? 'true' : 'false').catch(() => {})
      return serverStatus
    }
  } catch (netErr) {
    console.warn('Network error checking onboarding status, using local cache:', netErr)
  }

  // Offline / Network Failure Fallback:
  // 1. Read from local cache if present
  const cached = await AsyncStorage.getItem(cacheKey).catch(() => null)
  if (cached !== null) {
    return cached === 'true'
  }

  // 2. If no cache and existing memories exist, treat as completed
  if (hasLocalMemories) {
    await AsyncStorage.setItem(cacheKey, 'true').catch(() => {})
    return true
  }

  return false
}

/**
 * Idempotently marks onboarding as completed on both the local cache
 * and the authoritative public.profiles server table.
 */
export async function markOnboardingComplete(userId: string): Promise<void> {
  if (!userId) return

  const cacheKey = `${ONBOARDING_CACHE_PREFIX}${userId}`
  const pendingSyncKey = `${PENDING_SYNC_PREFIX}${userId}`

  // 1. Update local cache immediately for instantaneous UI response
  await AsyncStorage.setItem(cacheKey, 'true').catch(() => {})

  // 2. Persist to authoritative public.profiles in Supabase
  try {
    const { error } = await supabase.rpc('complete_onboarding')
    if (error) {
      // Fallback direct upsert
      await supabase
        .from('profiles')
        .upsert({ id: userId, has_completed_onboarding: true, updated_at: new Date().toISOString() })
    }
    // Clear any pending sync on success
    await AsyncStorage.removeItem(pendingSyncKey).catch(() => {})
  } catch (err) {
    console.warn('Could not sync onboarding completion to server immediately; queuing for sync:', err)
    // Mark pending sync so it reconciles on next network opportunity
    await AsyncStorage.setItem(pendingSyncKey, 'true').catch(() => {})
  }
}

/**
 * Resets onboarding status for testing purposes.
 */
export async function resetOnboardingForTesting(userId: string): Promise<void> {
  if (!userId) return

  const cacheKey = `${ONBOARDING_CACHE_PREFIX}${userId}`
  const pendingSyncKey = `${PENDING_SYNC_PREFIX}${userId}`

  await AsyncStorage.setItem(cacheKey, 'false').catch(() => {})
  await AsyncStorage.removeItem(pendingSyncKey).catch(() => {})

  try {
    await supabase
      .from('profiles')
      .upsert({ id: userId, has_completed_onboarding: false, updated_at: new Date().toISOString() })
  } catch (err) {
    console.error('Failed to reset onboarding on server:', err)
  }
}

/**
 * Syncs any pending offline onboarding completion to the server.
 */
export async function syncPendingOnboarding(userId: string): Promise<void> {
  if (!userId) return
  const pendingSyncKey = `${PENDING_SYNC_PREFIX}${userId}`

  try {
    await supabase.rpc('complete_onboarding')
    await AsyncStorage.removeItem(pendingSyncKey).catch(() => {})
  } catch {
    // Will retry next time
  }
}
