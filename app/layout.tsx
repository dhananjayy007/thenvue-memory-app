import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://thenvue.com'),
  title: {
    default: 'Thenvue — Personal Memory & AI Journal',
    template: '%s | Thenvue',
  },
  description:
    'Capture moments, photos, and thoughts. Search your memories, rediscover forgotten moments, and ask AI about your life with Thenvue.',
  generator: 'Thenvue',
  applicationName: 'Thenvue',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Thenvue — Personal Memory & AI Journal',
    description:
      'Capture moments, photos, and thoughts. Search your memories, rediscover forgotten moments, and ask AI about your life with Thenvue.',
    url: 'https://thenvue.com',
    siteName: 'Thenvue',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Thenvue — Your life, remembered.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thenvue — Personal Memory & AI Journal',
    description:
      'Capture moments, photos, and thoughts. Search your memories, rediscover forgotten moments, and ask AI about your life with Thenvue.',
    images: ['/og-image.png'],
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
