'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import UserMenu from '@/components/UserMenu'

export default function Navbar() {
  const { user, loading, openAuthModal } = useAuth()

  return (
    <nav
      className="sticky top-0 z-50 border-b border-line"
      style={{ background: 'rgba(251,247,241,.9)', backdropFilter: 'blur(8px)' }}
    >
      <div className="mx-auto flex h-[68px] max-w-page items-center justify-between px-7">
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity shrink-0" aria-label="Cut Recipe — home">
          <Image
            src="/navbar-logo.png"
            alt="Cut Recipe"
            width={175}
            height={60}
            priority
          />
        </Link>

        {/* Links */}
        <div className="flex items-center gap-[30px] text-[14.5px] text-muted">
          <a href="/" className="hidden sm:block text-ink hover:text-ink/70 transition-colors">
            Recipe extractor
          </a>
          <a href="/#cook-from-photo" className="hidden sm:flex items-center gap-1.5 hover:text-ink transition-colors">
            From a photo
            <span className="rounded-full bg-accent-soft px-2 py-px text-[10px] font-semibold text-accent" style={{ lineHeight: '16px' }}>
              Soon
            </span>
          </a>
          <Link href="/blog" className="hidden sm:block hover:text-ink transition-colors">
            Blog
          </Link>

          {loading ? (
            <div
              style={{ width: 90, height: 34, borderRadius: 99, background: '#EDE5DB' }}
              aria-hidden="true"
            />
          ) : user ? (
            <UserMenu />
          ) : (
            <button
              onClick={openAuthModal}
              className="rounded-pill border border-line bg-white px-4 py-2 text-ink hover:bg-bg transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
