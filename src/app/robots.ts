import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block API routes, auth callbacks, and the account page
        // (account has no indexable content — it's a logged-in dashboard)
        disallow: ['/api/', '/account', '/auth/'],
      },
    ],
    sitemap: 'https://cutrecipe.com/sitemap.xml',
    host: 'https://cutrecipe.com',
  }
}
