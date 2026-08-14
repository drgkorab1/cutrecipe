import Link from 'next/link'
import Image from 'next/image'
import { POSTS } from '@/lib/posts'
import { POST_IMAGES } from '@/lib/blog-meta'

const PREVIEW = POSTS.slice(0, 6)

export default function Blog() {
  return (
    <section className="border-t border-line" style={{ padding: '76px 0' }}>
      <div className="mx-auto max-w-page px-7">
        <h2
          className="text-center font-serif font-semibold text-ink"
          style={{ fontSize: 34, marginBottom: 12 }}
        >
          From the blog
        </h2>
        <p
          className="mx-auto mb-[46px] text-center text-muted"
          style={{ fontSize: 17, maxWidth: '56ch' }}
        >
          Cooking notes, kitchen shortcuts, and the occasional rant about recipe websites.
        </p>

        <div className="grid gap-[22px] grid-cols-1 sm:grid-cols-3">
          {PREVIEW.map((post) => {
            const img = POST_IMAGES[post.slug]
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                <article
                  className="overflow-hidden border border-line bg-card hover:shadow-md transition-shadow"
                  style={{ borderRadius: 14, height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ height: 118, position: 'relative', background: post.gradient, flexShrink: 0 }}>
                    {img && (
                      <Image
                        src={img}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ padding: '17px 19px 21px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p
                      className="font-bold uppercase tracking-[.08em] text-accent"
                      style={{ fontSize: 11.5 }}
                    >
                      {post.category}
                    </p>
                    <h3
                      className="font-serif font-semibold text-ink"
                      style={{ fontSize: 17, margin: '7px 0 6px', lineHeight: 1.3, flex: 1 }}
                    >
                      {post.title}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p className="text-muted" style={{ fontSize: 12 }}>{post.author}</p>
                      <p className="text-muted" style={{ fontSize: 12 }}>{post.readTime}</p>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link
            href="/blog"
            style={{
              display: 'inline-block',
              padding: '10px 28px',
              borderRadius: 99,
              border: '1px solid var(--line)',
              background: 'white',
              fontSize: 14,
              color: 'var(--ink)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
            className="hover:bg-bg transition-colors"
          >
            All {POSTS.length} articles →
          </Link>
        </div>
      </div>
    </section>
  )
}
