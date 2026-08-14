'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { RecipeData } from '@/types/recipe'
import RecipeCard from './RecipeCard'
import SkeletonCard from './SkeletonCard'

type Mode  = 'url' | 'text'
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: RecipeData }
  | { status: 'error'; message: string; sourceUrl?: string }

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

export default function RecipeForm() {
  const [mode, setMode]   = useState<Mode>('url')
  const [url, setUrl]     = useState('')
  const [text, setText]   = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const resultRef         = useRef<HTMLDivElement>(null)

  const runExtract = useCallback(async (body: { url?: string; text?: string }) => {
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
        // TikTok-specific: if the server returned a meaningful caption, pre-fill text mode.
        // Skip auto-switching for short/hashtag-only captions — not helpful to the user.
        if (data.caption && data.caption.length > 80 && mode === 'url') {
          setText(data.caption)
          setMode('text')
        }
        setState({
          status: 'error',
          message: data.error ?? 'Something went wrong.',
          sourceUrl: data.sourceUrl ?? body.url,
        })
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        return
      }

      if (body.url) window.history.pushState({}, '', `/?r=${urlToSlug(body.url)}`)
      setState({ status: 'success', data: data as RecipeData })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch {
      setState({ status: 'error', message: 'Could not connect. Please check your connection and try again.' })
    }
  }, [mode])

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
        </div>
      )}
    </>
  )
}
