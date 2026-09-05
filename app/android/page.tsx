import type { Metadata } from 'next'
import { AndroidDownloadContent } from '@/components/android/android-download-content'

export const metadata: Metadata = {
  title: 'Thenvue for Android — Personal Memory App',
  description:
    'Download Thenvue for Android to capture memories, photos, and voice notes and search your personal timeline with AI.',
  alternates: {
    canonical: '/android',
  },
  openGraph: {
    title: 'Thenvue for Android — Personal Memory App',
    description:
      'Download Thenvue for Android to capture memories, photos, and voice notes and search your personal timeline with AI.',
    url: 'https://thenvue.com/android',
  },
}

export default function AndroidPage() {
  return <AndroidDownloadContent />
}
