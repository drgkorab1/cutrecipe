import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuthorChip from '@/components/AuthorChip'
import { POSTS } from '@/lib/posts'
import { POST_IMAGES, AUTHOR_BIOS } from '@/lib/blog-meta'

const BASE_URL = 'https://cutrecipe.com'

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = POSTS.find((p) => p.slug === slug)
  if (!post) return {}

  const img = POST_IMAGES[post.slug]
  const canonicalUrl = `${BASE_URL}/blog/${slug}`

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],

    alternates: { canonical: canonicalUrl },

    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: post.title,
      description: post.excerpt,
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      section: post.category,
      ...(img && {
        images: [{ url: img, width: 1200, height: 630, alt: post.title }],
      }),
    },

    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(img && { images: [img] }),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = POSTS.find((p) => p.slug === slug)
  if (!post) notFound()

  const img = POST_IMAGES[post.slug]
  const related = POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3)
  const canonicalUrl = `${BASE_URL}/blog/${slug}`
  const authorBio = AUTHOR_BIOS[post.author]

  // Article JSON-LD for Google rich results
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: canonicalUrl,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
      ...(authorBio && { description: authorBio.bio }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cut Recipe',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    articleSection: post.category,
    ...(img && { image: { '@type': 'ImageObject', url: img, width: 1200, height: 630 } }),
  }

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navbar />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>

        {/* Back */}
        <Link
          href="/blog"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--muted)', textDecoration: 'none', marginBottom: 36 }}
          className="hover:text-ink transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All articles
        </Link>

        {/* Hero image */}
        <div style={{ height: 320, borderRadius: 18, overflow: 'hidden', background: post.gradient, marginBottom: 36, position: 'relative' }}>
          {img && (
            <Image
              src={img}
              alt={post.title}
              fill
              priority
              sizes="720px"
              style={{ objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 10px', borderRadius: 99 }}>
            {post.category}
          </span>
          <AuthorChip author={post.author} />
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>·</span>
          <time dateTime={new Date(post.date).toISOString()} style={{ fontSize: 13, color: 'var(--muted)' }}>
            {post.date}
          </time>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{post.readTime}</span>
        </div>

        {/* Title */}
        <h1 className="font-serif font-semibold text-ink" style={{ fontSize: 38, lineHeight: 1.15, marginBottom: 32 }}>
          {post.title}
        </h1>

        {/* Article body */}
        <div
          className="prose-article"
          dangerouslySetInnerHTML={{ __html: post.content }}
          style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--ink)' }}
        />

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: 72, borderTop: '1px solid var(--line)', paddingTop: 48 }}>
            <h2 className="font-serif font-semibold text-ink" style={{ fontSize: 24, marginBottom: 24 }}>
              More in {post.category}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {related.map((r) => {
                const rImg = POST_IMAGES[r.slug]
                return (
                  <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', transition: 'box-shadow .15s' }}
                      className="hover:shadow-sm"
                    >
                      <div style={{ height: 90, position: 'relative', background: r.gradient }}>
                        {rImg && (
                          <Image
                            src={rImg}
                            alt={r.title}
                            fill
                            sizes="220px"
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--accent)', marginBottom: 4 }}>{r.category}</p>
                        <p className="font-serif font-semibold text-ink" style={{ fontSize: 15, lineHeight: 1.3 }}>{r.title}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  )
}
