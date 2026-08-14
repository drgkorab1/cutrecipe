'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/context/AuthContext'

export default function AuthModal() {
  const { signIn, signUp, closeAuthModal } = useAuth()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAuthModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeAuthModal])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (tab === 'signup' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const { error: err } = tab === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, fullName || undefined)
    setLoading(false)

    if (err) setError(err)
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) closeAuthModal()
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(30,27,24,.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          background: 'var(--card, #FFFCF8)',
          borderRadius: 20,
          border: '1px solid var(--line)',
          boxShadow: '0 24px 64px -16px rgba(30,27,24,.35)',
          width: '100%',
          maxWidth: 420,
          padding: '36px 32px 32px',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'signin' ? 'Sign in' : 'Create account'}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2
            className="font-serif font-semibold text-ink"
            style={{ fontSize: 26, lineHeight: 1.2, marginBottom: 6 }}
          >
            {tab === 'signin' ? 'Sign in' : 'Create account'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {tab === 'signin'
              ? 'Welcome back — sign in to see your saved recipes.'
              : 'Save recipes and access them anywhere.'}
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#F4EFE8',
            borderRadius: 10,
            padding: 3,
            marginBottom: 24,
          }}
        >
          {(['signin', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all .15s',
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? 'var(--ink)' : 'var(--muted)',
                boxShadow: tab === t ? '0 1px 4px rgba(30,27,24,.12)' : 'none',
              }}
            >
              {t === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'signup' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 5 }}>
                  First name <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 13px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    background: 'white',
                    fontSize: 15,
                    color: 'var(--ink)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 5 }}>
                  Last name <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 13px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    background: 'white',
                    fontSize: 15,
                    color: 'var(--ink)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 13px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'white',
                fontSize: 15,
                color: 'var(--ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              required
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 13px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'white',
                fontSize: 15,
                color: 'var(--ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {tab === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 5 }}>
                Confirm password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 13px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'white',
                  fontSize: 15,
                  color: 'var(--ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {error && (
            <p style={{ fontSize: 13.5, color: '#C0392B', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '11px 0',
              borderRadius: 10,
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity .15s',
            }}
          >
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Close */}
        <button
          onClick={closeAuthModal}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 16, right: 18,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: 'var(--muted)',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>,
    document.body,
  )
}
