import type { Metadata } from 'next'
import { AndroidComingSoonContent } from '@/components/android/android-coming-soon-content'

export const metadata: Metadata = {
  title: 'Thenvue for Android — Coming Soon',
  description:
    "Thenvue for Android is coming soon. Join the waitlist to be notified when Google Play and early beta access open.",
  alternates: {
    canonical: '/android',
  },
  openGraph: {
    title: 'Thenvue for Android — Coming Soon',
    description:
      "Thenvue for Android is coming soon. Join the waitlist to be notified when Google Play and early beta access open.",
    url: 'https://thenvue.com/android',
  },
}

export default function AndroidPage() {
  return <AndroidComingSoonContent />
}
