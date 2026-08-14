'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AuthorChip from '@/components/AuthorChip'
import type { Post } from '@/lib/posts'
import { POST_IMAGES } from '@/lib/blog-meta'

export default function BlogCard({ post }: { post: Post }) {
  const router = useRouter()
  const img = POST_IMAGES[post.slug]

  return (
    <div
      onClick={() => router.push(`/blog/${post.slug}`)}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'box-shadow .18s, border-color .18s',
      }}
      className="hover:shadow-md hover:border-[#D4C4B4]"
    >
      {/* Image / gradient header */}
      <div style={{ height: 160, position: 'relative', background: post.gradient, flexShrink: 0 }}>
        {img && (
          <Image
            src={img}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--accent)' }}>
          {post.category}
        </p>
        <h2
          className="font-serif font-semibold text-ink"
          style={{ fontSize: 17, lineHeight: 1.3, margin: 0 }}
        >
          {post.title}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, flex: 1, margin: 0 }}>
          {post.excerpt}
        </p>

        {/* Footer row — stop propagation so clicking author doesn't navigate */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}
        >
          <AuthorChip author={post.author} />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{post.readTime}</span>
        </div>
      </div>
    </div>
  )
}
