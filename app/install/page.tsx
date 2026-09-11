import type { Metadata } from 'next'
import { InstallPageContent } from '@/components/install/install-page-content'

export const metadata: Metadata = {
  title: 'Install Thenvue — iOS & Android Apps',
  description:
    'Take your memories everywhere. Join the waitlist for Thenvue native iOS and Android apps, or install the mobile web app to your phone today.',
  alternates: {
    canonical: '/install',
  },
  openGraph: {
    title: 'Install Thenvue — iOS & Android Apps',
    description:
      'Take your memories everywhere. Join the waitlist for Thenvue native iOS and Android apps, or install the mobile web app to your phone today.',
    url: 'https://thenvue.com/install',
  },
}

export default function InstallPage() {
  return <InstallPageContent />
}
