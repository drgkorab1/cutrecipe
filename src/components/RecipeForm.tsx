'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { RecipeData } from '@/types/recipe'
import RecipeCard from './RecipeCard'
import SkeletonCard from './SkeletonCard'
import { useAuth } from '@/context/AuthContext'

type Mode  = 'url' | 'text'
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: RecipeData }
  | { status: 'error'; message: string; sourceUrl?: string }
  | { status: 'limit_reached' }

function urlToSlug(url: string): string {
  try {
    const u = new URL(url)
    return (u.hostname + u.pathname)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)
  } catch {
    return 'recipe'
  }
}

// ─── Client-side daily limit (avoids Netlify function invocations when blocked) ─
const DAILY_KEY          = 'anon_recipe_count'
const CLIENT_DAILY_LIMIT = 5

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getLocalCount(): number {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { date: string; count: number }
    return parsed.date === todayStr() ? parsed.count : 0
  } catch {
    return 0
  }
}

function bumpLocalCount(): void {
  try {
    const count = getLocalCount() + 1
    localStorage.setItem(DAILY_KEY, JSON.stringify({ date: todayStr(), count }))
  } catch { /* ignore */ }
}

function setLocalLimitReached(): void {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify({ date: todayStr(), count: CLIENT_DAILY_LIMIT }))
  } catch { /* ignore */ }
}

export default function RecipeForm() {
  const { openAuthModal, user, loading: authLoading } = useAuth()
  const [mode, setMode]   = useState<Mode>('url')
  const [url, setUrl]     = useState('')
  const [text, setText]   = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const resultRef         = useRef<HTMLDivElement>(null)

  const runExtract = useCallback(async (body: { url?: string; text?: string }) => {
    // Client-side guard: skip the API call entirely if limit already reached.
    // Auth must be resolved first — if still loading we can't tell if user is logged in.
    if (!authLoading && !user && getLocalCount() >= CLIENT_DAILY_LIMIT) {
      setState({ status: 'limit_reached' })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      return
    }

    setState({ status: 'loading' })
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )

    try {
      const res  = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'daily_limit_reached') {
          setLocalLimitReached()
          setState({ status: 'limit_reached' })
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
          return
        }
        // TikTok video: if the server returned a meaningful caption, auto-submit it
        // as text so the user gets the recipe without any manual steps.
        // Skip for photo posts — the caption was already tried server-side and failed;
        // the recipe lives in the slide images, so re-submitting won't help.
        const isPhotoPost = /\/photo\/\d+/.test(body.url ?? '')
        if (!isPhotoPost && data.caption && data.caption.length > 80 && mode === 'url') {
          await runExtract({ text: data.caption })
          return
        }
        setState({
          status: 'error',
          message: data.error ?? 'Something went wrong.',
          sourceUrl: data.sourceUrl ?? body.url,
        })
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        return
      }

      // Successful extraction — increment local count for anonymous users
      if (!user) bumpLocalCount()

      if (body.url) window.history.pushState({}, '', `/?r=${urlToSlug(body.url)}`)
      setState({ status: 'success', data: data as RecipeData })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch {
      setState({ status: 'error', message: 'Could not connect. Please check your connection and try again.' })
    }
  }, [mode, user, authLoading])

  // Auto-extract when redirected from account page with ?autoextract=<url>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const autoUrl = params.get('autoextract')
    if (!autoUrl) return
    window.history.replaceState({}, '', '/')
    setUrl(autoUrl)
    setMode('url')
    runExtract({ url: autoUrl })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = mode === 'url' ? { url: url.trim() } : { text: text.trim() }
    await runExtract(body)
  }

  const canSubmit = state.status !== 'loading' && (
    mode === 'url' ? url.trim().length > 0 : text.trim().length > 0
  )

  return (
    <>
      {/* Mode toggle */}
      <div className="mx-auto mb-3 flex w-fit rounded-full border border-line bg-card p-1" style={{ gap: 2 }}>
        {(['url', 'text'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: '6px 18px',
              borderRadius: 99,
              border: 'none',
              fontSize: 13.5,
              fontWeight: 500,
              cursor: 'pointer',
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? 'white' : 'var(--muted)',
              transition: 'background .15s, color .15s',
            }}
          >
            {m === 'url' ? 'From a link' : 'Paste text'}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="mx-auto w-full" style={{ maxWidth: 690 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div
            className="rounded-recipe border border-line bg-card"
            style={{ padding: 10, boxShadow: '0 12px 34px -18px rgba(30,27,24,.32)' }}
          >
            {mode === 'url' ? (
              <div className="flex gap-[10px]">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a recipe URL, YouTube or TikTok link…"
                  className="min-w-0 flex-1 bg-transparent font-[inherit] text-[16px] text-ink outline-none"
                  style={{ padding: '14px 16px' }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="shrink-0 cursor-pointer rounded-btn bg-accent font-[inherit] font-semibold text-white transition-colors hover:bg-[#A9451F] disabled:cursor-wait disabled:opacity-70"
                  style={{ fontSize: 15.5, padding: '14px 24px' }}
                >
                  {state.status === 'loading' ? 'Extracting…' : 'Get the recipe only'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"Paste any recipe text here — from a TikTok caption, comment, screenshot, or anywhere else.\n\nWe'll pull out the ingredients and steps."}
                  className="min-w-0 w-full bg-transparent font-[inherit] text-[15px] text-ink outline-none resize-none"
                  style={{ padding: '14px 16px', minHeight: 130, lineHeight: 1.6 }}
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                <div className="flex justify-end" style={{ padding: '0 4px 4px' }}>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="shrink-0 cursor-pointer rounded-btn bg-accent font-[inherit] font-semibold text-white transition-colors hover:bg-[#A9451F] disabled:cursor-wait disabled:opacity-70"
                    style={{ fontSize: 15.5, padding: '14px 24px' }}
                  >
                    {state.status === 'loading' ? 'Structuring…' : 'Structure this recipe'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {mode === 'text' && (
            <p className="mt-2 text-center text-muted" style={{ fontSize: 12.5 }}>
              Works great for TikTok videos where the recipe is spoken — just copy what you see or hear.
            </p>
          )}
        </form>
      </div>

      {/* Result area */}
      {state.status !== 'idle' && (
        <div ref={resultRef} className="mt-8 scroll-mt-[80px] pb-[70px]">
          {state.status === 'loading' && <SkeletonCard />}

          {state.status === 'success' && <RecipeCard data={state.data} />}

          {state.status === 'error' && (
            <div
              className="mx-auto border border-line bg-card text-center"
              style={{ maxWidth: 1020, borderRadius: 20, padding: '48px 34px' }}
            >
              <p className="mb-2 font-serif text-[22px] font-semibold text-ink">
                No recipe found
              </p>
              <p className="mb-6 text-[15px] text-muted">{state.message}</p>
              {mode === 'url' && (
                <button
                  onClick={() => { setMode('text'); setState({ status: 'idle' }) }}
                  className="inline-block rounded-btn bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#A9451F]"
                >
                  Paste the description →
                </button>
              )}
            </div>
          )}

          {state.status === 'limit_reached' && (
            <div className="mx-auto" style={{ maxWidth: 1020, position: 'relative' }}>

              {/* Blurred recipe skeleton — purely decorative backdrop */}
              <div
                aria-hidden="true"
                style={{ filter: 'blur(4px)', opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }}
              >
                {/* Static skeleton card (no spinner/message — just the recipe shell) */}
                <div
                  className="overflow-hidden bg-card"
                  style={{
                    borderRadius: 20,
                    border: '1px solid var(--line)',
                    boxShadow: '0 20px 50px -30px rgba(30,27,24,.4)',
                  }}
                >
                  {/* Attribution strip */}
                  <div
                    className="flex items-center justify-between gap-4 px-4 py-[16px] sm:px-[26px]"
                    style={{ background: '#FCF9F5', borderBottom: '1px solid var(--line)' }}
                  >
                    <div className="skeleton h-4 w-52 rounded" />
                    <div className="skeleton h-4 w-28 rounded" />
                  </div>

                  <div className="px-4 pt-[26px] pb-9 sm:px-[34px] sm:pt-[30px]">
                    {/* Title */}
                    <div className="skeleton mb-2 h-8 w-3/4 rounded" />
                    <div className="skeleton mb-6 h-8 w-1/2 rounded" />

                    {/* Meta row */}
                    <div className="mb-6 flex flex-wrap gap-6">
                      {[80, 72, 90, 64].map((w, i) => (
                        <div key={i} className="skeleton h-5 rounded" style={{ width: w }} />
                      ))}
                    </div>

                    {/* Tool chips */}
                    <div className="mb-7 flex flex-wrap gap-[10px] border-b border-line pb-[26px]">
                      <div className="skeleton h-9 w-32 rounded-pill" />
                      <div className="skeleton h-9 w-20 rounded-pill" />
                      <div className="skeleton h-9 w-16 rounded-pill" />
                      <div className="skeleton h-9 w-24 rounded-pill" />
                    </div>

                    {/* Two-column content */}
                    <div className="grid gap-11 grid-cols-1 sm:grid-cols-[1fr_1.25fr]">
                      <div>
                        <div className="skeleton mb-4 h-4 w-24 rounded" />
                        {['full', '4/5', '3/4', 'full', '2/3', '5/6', '3/4', '4/5'].map((w, i) => (
                          <div key={i} className="border-b border-dashed border-[#EFE7DC] py-[9px]">
                            <div className={`skeleton h-[18px] w-${w} rounded`} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="skeleton mb-4 h-4 w-16 rounded" />
                        {[[100, 80, 60], [100, 88], [100, 75, 82], [100, 66]].map((lines, i) => (
                          <div key={i} className="flex gap-[14px] py-[11px]">
                            <div className="skeleton shrink-0 rounded-full" style={{ width: 26, height: 26 }} />
                            <div className="flex-1 space-y-2">
                              {lines.map((pct, j) => (
                                <div key={j} className="skeleton h-4 rounded" style={{ width: `${pct}%` }} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gradient veil + message card */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  background: 'linear-gradient(to bottom, rgba(251,247,241,0.15) 0%, rgba(251,247,241,0.65) 35%, rgba(251,247,241,0.96) 70%)',
                }}
              >
                <div
                  className="px-6 py-10 sm:px-14 sm:py-[52px]"
                  style={{
                    background: '#FFFDF9',
                    border: '1px solid var(--line)',
                    borderRadius: 20,
                    maxWidth: 500,
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px -16px rgba(30,27,24,.2)',
                  }}
                >
                  <p style={{ fontSize: 44, marginBottom: 16, lineHeight: 1 }}>🍳</p>
                  <h2
                    className="font-serif font-semibold"
                    style={{ fontSize: 'clamp(20px, 5vw, 27px)', color: 'var(--ink)', marginBottom: 14, lineHeight: 1.25 }}
                  >
                    You're on a roll — 5 recipes today!
                  </h2>
                  <p style={{ fontSize: 15.5, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 32 }}>
                    That's your free daily allowance. Come back tomorrow for more, or create a free account to get unlimited extractions and save your favourites — no credit card needed.
                  </p>
                  <button
                    onClick={openAuthModal}
                    className="rounded-btn bg-accent font-semibold text-white transition-colors hover:bg-[#A9451F]"
                    style={{ fontSize: 15, padding: '13px 28px', width: '100%', marginBottom: 12 }}
                  >
                    Create a free account →
                  </button>
                  <button
                    onClick={openAuthModal}
                    style={{
                      fontSize: 13.5,
                      color: 'var(--muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      padding: 0,
                    }}
                    className="hover:text-ink transition-colors"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </>
  )
}
