'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { List, Search, Bookmark, Globe, ChefHat } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import RecipeCard from '@/components/RecipeCard'

interface SavedRecipe {
  id: string
  title: string
  author: string | null
  source_url: string | null
  cover_url: string | null
  saved_at: string
  total_minutes: number | null
  servings: string | null
  ingredients: string[] | null
  steps: string[] | null
}

type Tab = 'recipes' | 'settings'

export default function AccountPage() {
  const { user, loading, openAuthModal, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('recipes')
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [activeRecipe, setActiveRecipe] = useState<SavedRecipe | null>(null)
  const [extractionCount, setExtractionCount] = useState<number>(0)

  const [newPassword, setNewPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [removeTarget, setRemoveTarget] = useState<SavedRecipe | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) { openAuthModal(); router.replace('/') }
  }, [loading, user, openAuthModal, router])

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_recipes')
      .select('id, title, author, source_url, cover_url, saved_at, total_minutes, servings, ingredients, steps')
      .order('saved_at', { ascending: false })
      .then(({ data }) => { setRecipes((data as SavedRecipe[]) ?? []); setRecipesLoading(false) })
    supabase
      .from('user_extractions')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setExtractionCount(count ?? 0))
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function confirmRemove() {
    if (!removeTarget) return
    setRemoveLoading(true)
    await supabase.from('user_recipes').delete().eq('id', removeTarget.id)
    setRecipes((prev) => prev.filter((r) => r.id !== removeTarget.id))
    setRemoveLoading(false)
    setRemoveTarget(null)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null); setPwSuccess(false)
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) setPwError(error.message)
    else { setPwSuccess(true); setNewPassword('') }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) { await signOut(); router.replace('/') }
    else {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Failed to delete account.')
      setDeleteLoading(false)
    }
  }

  function getYouTubeThumbnail(url: string | null): string | null {
    if (!url) return null
    try {
      const u = new URL(url)
      const host = u.hostname.replace(/^www\./, '')
      let videoId: string | null = null
      if (host === 'youtube.com' && u.pathname === '/watch') videoId = u.searchParams.get('v')
      else if (host === 'youtu.be') videoId = u.pathname.slice(1)
      if (!videoId) return null
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    } catch { return null }
  }

  if (loading || !user) return null

  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim() || null
  const displayName = fullName ?? user.email ?? ''
  const initial = (fullName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  function getDomain(url: string | null): string | null {
    if (!url) return null
    try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
  }

  const chipStyle: React.CSSProperties = {
    fontSize: 12.5, color: 'var(--muted)',
    background: 'rgba(255,255,255,.75)',
    border: '1px solid rgba(192,83,42,.15)',
    borderRadius: 99,
    padding: '4px 12px',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  }

  const saveRate = extractionCount >= recipes.length && extractionCount > 0 && recipes.length > 0
    ? Math.round((recipes.length / extractionCount) * 100)
    : null

  const totalCookTime = (() => {
    const mins = recipes.reduce((sum, r) => sum + (r.total_minutes ?? 0), 0)
    if (!mins) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h ${m}min`
  })()

  const youtubeCount = recipes.filter(r =>
    r.source_url?.includes('youtube.com') || r.source_url?.includes('youtu.be')
  ).length

  const topDomain = (() => {
    const counts: Record<string, number> = {}
    for (const r of recipes) {
      if (!r.source_url) continue
      try {
        const host = new URL(r.source_url).hostname.replace(/^www\./, '')
        if (host.includes('youtube') || host.includes('youtu.be')) continue
        counts[host] = (counts[host] ?? 0) + 1
      } catch { /* skip */ }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? null
  })()

  return (
    <>
      <Navbar />

      <main className="mx-auto px-5 pb-24 pt-10 sm:px-8" style={{ maxWidth: 780 }}>

        {/* ── Profile header ────────────────────────────────────────────── */}
        <div
          className="mb-8 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #F6E7DE 0%, #FAF6F0 55%, #FFFCF9 100%)',
            border: '1px solid var(--line)',
            borderRadius: 20,
            padding: '28px 28px',
          }}
        >
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
            {/* Avatar */}
            <div
              style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700,
                fontFamily: 'var(--font-fraunces)',
                border: '3px solid white',
                outline: '2.5px solid var(--accent)',
                boxShadow: '0 4px 18px -4px rgba(192,83,42,.45)',
              }}
            >
              {initial}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h1
                className="font-serif font-semibold text-ink"
                style={{ fontSize: 'clamp(20px, 4vw, 26px)', marginBottom: 5, lineHeight: 1.2 }}
              >
                {timeOfDay}, {displayName}!
              </h1>
              <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                Member since {memberSince}
              </p>
            </div>

            {/* Recipe count — desktop only */}
            {!recipesLoading && recipes.length > 0 && (
              <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-1" style={{ flexShrink: 0 }}>
                <p className="font-serif font-bold" style={{ fontSize: 44, color: 'var(--accent)', lineHeight: 1 }}>
                  {recipes.length}
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.5, textAlign: 'right' }}>
                  {recipes.length === 1 ? 'recipe' : 'recipes'}<br />saved
                </p>
              </div>
            )}
          </div>

          {/* Stat chips */}
          {!recipesLoading && (extractionCount > 0 || recipes.length > 0) && (
            <div
              className="flex flex-wrap justify-center gap-2 sm:justify-start"
              style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(192,83,42,.12)' }}
            >
              {extractionCount >= recipes.length && extractionCount > 0 && (
                <span style={chipStyle}><Search size={11} strokeWidth={2} className="text-accent/60" />{extractionCount} {extractionCount === 1 ? 'recipe' : 'recipes'} explored</span>
              )}
              {saveRate !== null && (
                <span style={chipStyle}><Bookmark size={11} strokeWidth={2} className="text-accent/60" />{saveRate}% save rate</span>
              )}
              {topDomain && <span style={chipStyle}><Globe size={11} strokeWidth={2} className="text-accent/60" />Often from {topDomain}</span>}
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid var(--line)', marginBottom: 32, display: 'flex' }}>
          {([
            { id: 'recipes', label: 'My Recipes', count: !recipesLoading ? recipes.length : null },
            { id: 'settings', label: 'Settings', count: null },
          ] as { id: Tab; label: string; count: number | null }[]).map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: tab === id ? 600 : 400,
                color: tab === id ? 'var(--ink)' : 'var(--muted)',
                transition: 'color .15s',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
              className={tab !== id ? 'hover:text-ink' : ''}
            >
              {label}
              {count !== null && count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: tab === id ? 'var(--accent-soft)' : 'var(--line)',
                  color: tab === id ? 'var(--accent)' : 'var(--muted)',
                  borderRadius: 99, padding: '1px 7px',
                  transition: 'all .15s',
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Recipes tab ──────────────────────────────────────────────── */}
        {tab === 'recipes' && (
          <>
            {recipesLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 220, borderRadius: 18 }} />
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <ChefHat size={48} strokeWidth={1.25} style={{ color: 'var(--accent)', opacity: .4 }} />
                </div>
                <p className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
                  Your cookbook is empty
                </p>
                <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: '34ch', margin: '0 auto 28px', lineHeight: 1.65 }}>
                  Save any recipe and it'll live here, ready to cook from.
                </p>
                <Link href="/" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 26px', borderRadius: 99,
                  background: 'var(--accent)', color: 'white',
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  boxShadow: '0 4px 16px -4px rgba(192,83,42,.45)',
                }}>
                  Extract a recipe →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {recipes.map((r) => {
                  const ingCount = r.ingredients?.length ?? null
                  const stepsCount = r.steps?.length ?? null
                  const letter = r.title[0]?.toUpperCase() ?? '?'
                  const thumbnail = getYouTubeThumbnail(r.source_url) ?? r.cover_url ?? null

                  return (
                    <div
                      key={r.id}
                      onClick={() => setActiveRecipe(r)}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-[#D4C4B4] hover:shadow-md"
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Header image / letter banner */}
                      <div style={{
                        position: 'relative', height: 130, flexShrink: 0,
                        background: thumbnail ? '#000' : 'var(--accent-soft)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {thumbnail ? (
                          <img
                            src={thumbnail} alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .9 }}
                          />
                        ) : (
                          <span style={{
                            fontFamily: 'var(--font-fraunces)', fontSize: 64,
                            fontWeight: 700, color: 'var(--accent)',
                            lineHeight: 1, opacity: .2, userSelect: 'none',
                          }}>
                            {letter}
                          </span>
                        )}

                        {/* Remove — visible on hover */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setRemoveTarget(r) }}
                          className="absolute right-2.5 top-2.5 flex items-center justify-center rounded-full border border-white/40 bg-white/80 text-muted opacity-0 backdrop-blur-sm transition-all hover:bg-white hover:text-red-400 group-hover:opacity-100"
                          style={{ width: 28, height: 28, cursor: 'pointer' }}
                        >
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span className="sr-only">Remove</span>
                        </button>
                      </div>

                      {/* Card body */}
                      <div className="flex flex-col gap-3 p-5">

                        {/* Title + author */}
                        <div style={{ minHeight: 58 }}>
                          <p
                            className="font-serif font-semibold text-ink"
                            style={{
                              fontSize: 18, lineHeight: 1.3,
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            } as React.CSSProperties}
                          >
                            {r.title}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                            by <span className="text-accent/70">{r.author ?? getDomain(r.source_url) ?? '—'}</span>
                          </p>
                        </div>

                      {/* Meta row */}
                      {(ingCount !== null || stepsCount !== null) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                          {ingCount !== null && (
                            <span className="flex items-center gap-1">
                              <List size={12} strokeWidth={1.75} className="text-accent/60" />{ingCount} ingredients
                            </span>
                          )}
                          {stepsCount !== null && (
                            <span className="flex items-center gap-1">
                              <ChefHat size={12} strokeWidth={1.75} className="text-accent/60" />{stepsCount} steps
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span style={{ fontSize: 11, color: '#B0A499' }}>Saved {formatDate(r.saved_at)}</span>
                        <span
                          className="font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ fontSize: 12 }}
                        >
                          Open →
                        </span>
                      </div>
                      </div>{/* end card body */}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Settings tab ─────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Email + sign out */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 16, padding: '20px 22px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 8 }}>
                Signed in as
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 500, wordBreak: 'break-all' }}>
                  {user.email}
                </p>
                <button
                  onClick={() => { signOut(); router.replace('/') }}
                  style={{
                    padding: '7px 16px', borderRadius: 99, border: '1px solid var(--line)',
                    background: 'white', fontSize: 13.5, color: 'var(--ink)', fontWeight: 500, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  className="hover:bg-bg transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>

            {/* Change password */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 16, padding: '20px 22px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 14 }}>
                Change password
              </p>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{
                    padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)',
                    fontSize: 14, color: 'var(--ink)', background: 'var(--bg)',
                    outline: 'none', width: '100%', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={pwLoading || !newPassword}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 600,
                    cursor: pwLoading || !newPassword ? 'not-allowed' : 'pointer',
                    opacity: pwLoading || !newPassword ? 0.45 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {pwLoading ? 'Saving…' : 'Update password'}
                </button>
              </form>
              {pwError   && <p style={{ fontSize: 13, color: '#C0392B', marginTop: 10 }}>{pwError}</p>}
              {pwSuccess && <p style={{ fontSize: 13, color: 'var(--green)', marginTop: 10 }}>Password updated.</p>}
            </div>

            {/* Danger zone */}
            <div style={{
              background: '#FDF2F0', border: '1px solid #F0D5D0',
              borderRadius: 16, padding: '20px 22px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#C0392B', marginBottom: 6 }}>
                Danger zone
              </p>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
                Permanently deletes your account and all saved recipes. This cannot be undone.
              </p>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    padding: '8px 18px', borderRadius: 99, border: '1px solid #F0D5D0',
                    background: 'white', fontSize: 14, color: '#C0392B', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Delete account
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    style={{
                      padding: '8px 18px', borderRadius: 99, border: 'none',
                      background: '#C0392B', color: 'white', fontSize: 14, fontWeight: 500,
                      cursor: deleteLoading ? 'not-allowed' : 'pointer',
                      opacity: deleteLoading ? 0.7 : 1,
                    }}
                  >
                    {deleteLoading ? 'Deleting…' : 'Yes, delete everything'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    style={{
                      padding: '8px 16px', borderRadius: 99, border: '1px solid var(--line)',
                      background: 'white', fontSize: 14, cursor: 'pointer', color: 'var(--ink)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* ── Remove confirmation modal ──────────────────────────────────── */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-5"
          style={{ background: 'rgba(20,17,14,.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => !removeLoading && setRemoveTarget(null)}
        >
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 20, padding: '36px 32px', maxWidth: 400, width: '100%',
              boxShadow: '0 24px 60px -16px rgba(30,27,24,.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif font-semibold text-ink" style={{ fontSize: 20, marginBottom: 10 }}>
              Remove this recipe?
            </p>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 28 }}>
              <b className="text-ink font-semibold">{removeTarget.title}</b> will be removed from your saved recipes.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmRemove}
                disabled={removeLoading}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                  background: 'var(--ink)', color: 'white', fontSize: 14, fontWeight: 600,
                  cursor: removeLoading ? 'not-allowed' : 'pointer',
                  opacity: removeLoading ? 0.6 : 1, fontFamily: 'inherit',
                }}
              >
                {removeLoading ? 'Removing…' : 'Yes, remove it'}
              </button>
              <button
                onClick={() => setRemoveTarget(null)}
                disabled={removeLoading}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10,
                  border: '1px solid var(--line)', background: 'white',
                  fontSize: 14, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit',
                }}
                className="hover:bg-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recipe modal ───────────────────────────────────────────────── */}
      {activeRecipe && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto"
          style={{ background: 'rgba(20,17,14,.55)', backdropFilter: 'blur(4px)', padding: '24px 16px 40px' }}
          onClick={() => setActiveRecipe(null)}
        >
          <div
            style={{ maxWidth: 1060, margin: '0 auto', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveRecipe(null)}
              aria-label="Close"
              style={{
                position: 'absolute', top: -14, right: 0, zIndex: 10,
                background: 'white', border: '1px solid var(--line)',
                borderRadius: 99, width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--muted)',
                boxShadow: '0 2px 8px rgba(0,0,0,.12)',
              }}
              className="hover:text-ink transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <RecipeCard data={{
              title: activeRecipe.title,
              author: activeRecipe.author,
              authorUrl: null,
              sourceUrl: activeRecipe.source_url ?? '',
              coverUrl: activeRecipe.cover_url ?? undefined,
              ingredients: activeRecipe.ingredients ?? [],
              steps: activeRecipe.steps ?? [],
              totalMinutes: activeRecipe.total_minutes,
              servings: activeRecipe.servings,
            }} />
          </div>
        </div>
      )}
    </>
  )
}
