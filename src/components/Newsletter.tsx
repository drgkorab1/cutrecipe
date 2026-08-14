'use client'

import { useState } from 'react'

// Newsletter — §4.7 — dark rounded panel
export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
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

  return (
    <section id="newsletter" className="border-t border-line" style={{ padding: '76px 0' }}>
      <div className="mx-auto max-w-page px-7">
        <div
          className="px-5 py-10 sm:px-11 sm:py-[56px] text-center"
          style={{
            background: 'var(--ink)',
            color: '#F6F1EA',
            borderRadius: 22,
          }}
        >
          <h2
            className="font-serif font-semibold text-white"
            style={{ fontSize: 31, marginBottom: 10 }}
          >
            One good recipe, every Friday
          </h2>
          <p
            className="mx-auto"
            style={{ color: '#B6ADA3', fontSize: 16.5, maxWidth: '48ch', marginBottom: 28 }}
          >
            Tested, seasonal, and short enough to read on your phone in the shop.
            No spam, unsubscribe in one click.
          </p>

          {submitted ? (
            <p className="text-[16px] font-semibold text-white">
              You&rsquo;re in — see you Friday.
            </p>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex flex-col gap-[10px] sm:flex-row"
                style={{ maxWidth: 460 }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  disabled={loading}
                  className="newsletter-input min-w-0 flex-1 rounded-btn border text-white outline-none"
                  style={{
                    border: '1px solid #3A342E',
                    background: '#282320',
                    padding: '14px 16px',
                    fontSize: 15,
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 cursor-pointer rounded-btn bg-accent font-[inherit] font-semibold text-white transition-colors hover:bg-[#A9451F] disabled:opacity-60"
                  style={{ padding: '14px 24px', fontSize: 15 }}
                >
                  {loading ? 'Subscribing…' : 'Subscribe'}
                </button>
              </form>
              {error && (
                <p className="mt-3 text-[13px]" style={{ color: '#F4A58A' }}>{error}</p>
              )}
            </>
          )}

        </div>
      </div>

      {/* Inline style for newsletter input placeholder */}
      <style>{`
        .newsletter-input::placeholder { color: #7C736A; }
      `}</style>
    </section>
  )
}
