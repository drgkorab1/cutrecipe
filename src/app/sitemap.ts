import { MetadataRoute } from 'next'
import { POSTS } from '@/lib/posts'

const BASE_URL = 'https://cutrecipe.com'

// Parse "Month D, YYYY" date strings from blog posts into Date objects
function parsePostDate(dateStr: string): Date {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date() : d
}

export default function sitemap(): MetadataRoute.Sitemap {
  const blogEntries: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: parsePostDate(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...blogEntries,
  ]
}
