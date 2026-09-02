import { createClient } from '@/lib/supabase/server'
import { ThenvueLandingPage } from '@/components/landing/landing-page'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <ThenvueLandingPage user={Boolean(user)} />
}
