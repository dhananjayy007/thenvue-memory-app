import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMemories } from '@/app/memories/actions'
import { AppShell } from '@/components/app-shell'

export default async function AppPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    'there'

  const memberSince = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(user.created_at))

  const memories = await getMemories()

  return <AppShell displayName={displayName} memberSince={memberSince} initialMemories={memories} />
}
