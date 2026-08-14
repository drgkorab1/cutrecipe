'use client'

import { useState } from 'react'
import { AUTHOR_BIOS } from '@/lib/blog-meta'

export default function AuthorChip({ author }: { author: string }) {
  const [open, setOpen] = useState(false)
  const info = AUTHOR_BIOS[author]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--muted)',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: 3,
        }}
      >
        {author}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(30,27,24,0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card)',
              borderRadius: 20,
              padding: '36px 32px 32px',
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 20px 60px -10px rgba(30,27,24,0.25)',
              position: 'relative',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 99,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--muted)',
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Avatar */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 99,
                background: 'var(--accent-soft)',
                border: '2px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-fraunces), Georgia, serif',
                  fontSize: 26,
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}
              >
                {author[0]}
              </span>
            </div>

            {/* Name */}
            <h2
              style={{
                fontFamily: 'var(--font-fraunces), Georgia, serif',
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0 0 4px',
              }}
            >
              {author}
            </h2>

            {/* Specialty */}
            {info && (
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.09em',
                  color: 'var(--accent)',
                  marginBottom: 14,
                }}
              >
                {info.specialty}
              </p>
            )}

            {/* Bio */}
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.65,
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              {info?.bio ?? 'No bio available.'}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
