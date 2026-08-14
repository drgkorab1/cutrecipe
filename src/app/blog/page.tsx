import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BlogCard from '@/components/BlogCard'
import { POSTS } from '@/lib/posts'

export const metadata: Metadata = {
  title: 'Cooking Blog — Tips, Techniques & Kitchen Guides',
  description:
    'Practical cooking guides, kitchen shortcuts, and technique deep-dives. ' +
    'Braising, seasoning, stock, eggs — the fundamentals that actually make food taste better.',
  alternates: { canonical: 'https://cutrecipe.com/blog' },
  openGraph: {
    type: 'website',
    url: 'https://cutrecipe.com/blog',
    title: 'Cooking Blog — Tips, Techniques & Kitchen Guides | Cut Recipe',
    description:
      'Practical cooking guides, kitchen shortcuts, and technique deep-dives from the Cut Recipe team.',
  },
}

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 24px 96px' }}>
        <div style={{ marginBottom: 52, textAlign: 'center' }}>
          <h1 className="font-serif font-semibold text-ink" style={{ fontSize: 44, marginBottom: 14 }}>
            From the blog
          </h1>
          <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: '52ch', margin: '0 auto' }}>
            Cooking notes, kitchen shortcuts, and the occasional rant about recipe websites.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {POSTS.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
