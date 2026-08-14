'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [])

  const email = user?.email ?? ''
  const initial = email[0]?.toUpperCase() ?? '?'
  const truncated = email.length > 22 ? email.slice(0, 20) + '…' : email

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'white',
          border: '1px solid var(--line)',
          borderRadius: 99,
          padding: '5px 12px 5px 6px',
          cursor: 'pointer',
          fontSize: 14,
          color: 'var(--ink)',
        }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {initial}
        </span>
        <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {truncated}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--card, #FFFCF8)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            boxShadow: '0 8px 28px -6px rgba(30,27,24,.2)',
            minWidth: 160,
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              padding: '11px 16px',
              fontSize: 14,
              color: 'var(--ink)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--line)',
            }}
            className="hover:bg-bg transition-colors"
          >
            Account
          </Link>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); signOut() }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '11px 16px',
              fontSize: 14,
              color: 'var(--ink)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            className="hover:bg-bg transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
