'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [message, setMessage]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Could not connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div
        className="border border-line bg-card"
        style={{ borderRadius: 16, padding: '36px 32px', textAlign: 'center' }}
      >
        <p className="font-serif font-semibold text-ink" style={{ fontSize: 22, marginBottom: 8 }}>
          Message sent
        </p>
        <p className="text-muted" style={{ fontSize: 15 }}>
          Thanks for reaching out — we&apos;ll be in touch soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label
          htmlFor="name"
          className="mb-[7px] block text-[13px] font-semibold uppercase tracking-[.07em] text-muted"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          disabled={loading}
          className="w-full rounded-btn border border-line bg-card text-ink outline-none transition-colors focus:border-accent"
          style={{ padding: '13px 16px', fontSize: 15, fontFamily: 'inherit' }}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-[7px] block text-[13px] font-semibold uppercase tracking-[.07em] text-muted"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          disabled={loading}
          className="w-full rounded-btn border border-line bg-card text-ink outline-none transition-colors focus:border-accent"
          style={{ padding: '13px 16px', fontSize: 15, fontFamily: 'inherit' }}
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-[7px] block text-[13px] font-semibold uppercase tracking-[.07em] text-muted"
        >
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          required
          disabled={loading}
          rows={6}
          className="w-full resize-none rounded-btn border border-line bg-card text-ink outline-none transition-colors focus:border-accent"
          style={{ padding: '13px 16px', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6 }}
        />
      </div>

      {error && (
        <p className="text-[13.5px]" style={{ color: '#C0392B' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-btn bg-accent font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ padding: '14px 28px', fontSize: 15, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
