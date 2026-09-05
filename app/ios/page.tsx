import type { Metadata } from 'next'
import { IosComingSoonContent } from '@/components/ios/ios-coming-soon-content'

export const metadata: Metadata = {
  title: 'Thenvue for iPhone & iPad — Coming Soon',
  description:
    "Thenvue for iPhone and iPad is coming soon. Join the waitlist to be notified when it's available.",
  alternates: {
    canonical: '/ios',
  },
  openGraph: {
    title: 'Thenvue for iPhone & iPad — Coming Soon',
    description:
      "Thenvue for iPhone and iPad is coming soon. Join the waitlist to be notified when it's available.",
    url: 'https://thenvue.com/ios',
  },
}

export default function IosPage() {
  return <IosComingSoonContent />
}
