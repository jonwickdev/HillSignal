import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/signals/', '/ticker/', '/sector/', '/bill/', '/glossary', '/what-is-hillsignal', '/blog/', '/about', '/faq'],
        disallow: ['/api/', '/dashboard', '/settings', '/profile', '/success', '/checkout'],
      },
    ],
    sitemap: 'https://hillsignal.com/sitemap.xml',
  }
}
