import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // In a production environment, you would use your actual domain
  // or read it from an environment variable (e.g. process.env.NEXT_PUBLIC_BASE_URL)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://thenvue.com'

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
