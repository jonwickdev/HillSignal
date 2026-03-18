import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/signals/'],
        disallow: ['/api/', '/dashboard', '/settings', '/profile', '/success', '/checkout'],
      },
    ],
    sitemap: 'https://hillsignal.com/sitemap.xml',
  }
}
