import { createClient } from '@/lib/supabase/server'
import { ThenvueLandingPage } from '@/components/landing/landing-page'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://thenvue.com/#website',
        url: 'https://thenvue.com',
        name: 'Thenvue',
        description: 'Personal Memory & AI Journal',
      },
      {
        '@type': 'Organization',
        '@id': 'https://thenvue.com/#organization',
        name: 'Thenvue',
        url: 'https://thenvue.com',
        email: 'thenvue@gmail.com',
        logo: 'https://thenvue.com/icon.svg',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://thenvue.com/#app',
        name: 'Thenvue',
        url: 'https://thenvue.com',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web, Android, iOS',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ThenvueLandingPage user={Boolean(user)} />
    </>
  )
}
