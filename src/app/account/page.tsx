'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import RecipeCard from '@/components/RecipeCard'

interface SavedRecipe {
  id: string
  title: string
  author: string | null
  source_url: string | null
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

  const [newPassword, setNewPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) { openAuthModal(); router.replace('/') }
  }, [loading, user, openAuthModal, router])

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_recipes')
      .select('id, title, author, source_url, saved_at, total_minutes, servings, ingredients, steps')
      .order('saved_at', { ascending: false })
      .then(({ data }) => { setRecipes((data as SavedRecipe[]) ?? []); setRecipesLoading(false) })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRemove(id: string) {
    await supabase.from('user_recipes').delete().eq('id', id)
    setRecipes((prev) => prev.filter((r) => r.id !== id))
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

  const initial = (user.email?.[0] ?? '?').toUpperCase()
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '☀️ Morning' : hour < 17 ? '🌤 Afternoon' : '🌙 Evening'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <>
      <Navbar />

      <main style={{ maxWidth: 780, margin: '0 auto', padding: '36px 24px 96px' }}>

        {/* ── Profile row ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', marginRight: 4 }}
            className="hover:text-ink transition-colors" aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent-soft)', border: '2px solid var(--line)',
            color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-fraunces)',
          }}>
            {initial}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              {greeting} · Member since {memberSince}
            </p>
          </div>

          {!recipesLoading && recipes.length > 0 && (
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1, fontFamily: 'var(--font-fraunces)' }}>
                {recipes.length}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>
                saved
              </p>
            </div>
          )}
        </div>

        {/* ── Underline tabs ───────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid var(--line)', marginBottom: 32, display: 'flex', gap: 0 }}>
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
                  fontSize: 11,
                  fontWeight: 600,
                  background: tab === id ? 'var(--accent-soft)' : 'var(--line)',
                  color: tab === id ? 'var(--accent)' : 'var(--muted)',
                  borderRadius: 99,
                  padding: '1px 7px',
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 16 }} />)}
              </div>
            ) : recipes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <p style={{ fontSize: 40, marginBottom: 16 }}>📖</p>
                <p className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                  Your cookbook is empty
                </p>
                <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 28, maxWidth: '34ch', margin: '0 auto 28px' }}>
                  Save any recipe and it'll live here, ready to cook from.
                </p>
                <Link href="/" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 24px', borderRadius: 99,
                  background: 'var(--accent)', color: 'white',
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  boxShadow: '0 4px 16px -4px rgba(192,83,42,.45)',
                }}>
                  Extract a recipe →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {recipes.map((r) => {
                  const mins = r.total_minutes
                  const time = mins
                    ? mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`
                    : null
                  const ingCount = r.ingredients?.length ?? null
                  const letter = r.title[0]?.toUpperCase() ?? '?'
                  const thumbnail = getYouTubeThumbnail(r.source_url)

                  const card = (
                    <div style={{
                      background: 'var(--card)',
                      border: '1px solid var(--line)',
                      borderRadius: 18,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'box-shadow .18s, border-color .18s',
                    }}
                      className={r.source_url ? 'hover:shadow-md hover:border-[#D4C4B4]' : ''}
                    >
                      {/* Card header — thumbnail or letter banner */}
                      <div style={{
                        position: 'relative',
                        height: 140,
                        background: thumbnail ? '#000' : 'var(--accent-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .9 }}
                          />
                        ) : (
                          <span style={{
                            fontFamily: 'var(--font-fraunces)',
                            fontSize: 56,
                            fontWeight: 700,
                            color: 'var(--accent)',
                            lineHeight: 1,
                            opacity: .3,
                            userSelect: 'none',
                          }}>
                            {letter}
                          </span>
                        )}

                        {/* Remove button — always top-right */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(r.id) }}
                          title="Remove"
                          style={{
                            position: 'absolute', top: 10, right: 10, zIndex: 1,
                            background: 'rgba(255,255,255,.85)', border: 'none',
                            borderRadius: 99, cursor: 'pointer',
                            width: 28, height: 28,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--ink)',
                          }}
                          className="hover:bg-white transition-colors"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span className="sr-only">Remove</span>
                        </button>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '16px 22px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <p className="font-serif" style={{
                          fontSize: 19, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        } as React.CSSProperties}>
                          {r.title}
                        </p>

                        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 'auto' }}>
                          {r.author ? `by ${r.author}` : ''}
                        </p>

                        {/* Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {time && (
                            <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 99, padding: '3px 10px' }}>
                              ⏱ {time}
                            </span>
                          )}
                          {ingCount !== null && (
                            <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 99, padding: '3px 10px' }}>
                              {ingCount} ingredients
                            </span>
                          )}
                          {r.servings && (
                            <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 99, padding: '3px 10px' }}>
                              serves {r.servings}
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: 11.5, color: '#B0A499' }}>Saved {formatDate(r.saved_at)}</p>
                      </div>
                    </div>
                  )

                  return (
                    <div
                      key={r.id}
                      onClick={() => setActiveRecipe(r)}
                      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                    >
                      {card}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Settings tab ─────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Row: email (read-only) */}
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 4 }}>Email</p>
              <p style={{ fontSize: 15, color: 'var(--ink)' }}>{user.email}</p>
            </div>

            {/* Row: change password */}
            <div style={{ padding: '18px 0', borderBottom: '1px solid var(--line)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 12 }}>Password</p>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="password" placeholder="New password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{
                    padding: '9px 13px', borderRadius: 10, border: '1px solid var(--line)',
                    fontSize: 14, color: 'var(--ink)', background: 'var(--bg)',
                    outline: 'none', width: 210,
                  }}
                />
                <button type="submit" disabled={pwLoading || !newPassword}
                  style={{
                    padding: '9px 18px', borderRadius: 10, border: '1px solid var(--line)',
                    background: 'white', fontSize: 14, color: 'var(--ink)', fontWeight: 500,
                    cursor: pwLoading || !newPassword ? 'not-allowed' : 'pointer',
                    opacity: pwLoading || !newPassword ? 0.45 : 1,
                  }}>
                  {pwLoading ? 'Saving…' : 'Update'}
                </button>
              </form>
              {pwError   && <p style={{ fontSize: 13, color: '#C0392B', marginTop: 8 }}>{pwError}</p>}
              {pwSuccess && <p style={{ fontSize: 13, color: 'var(--green)', marginTop: 8 }}>Password updated.</p>}
            </div>

            {/* Row: sign out */}
            <div style={{ padding: '18px 0', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 3 }}>Session</p>
                <p style={{ fontSize: 14, color: 'var(--ink)' }}>Signed in as {user.email}</p>
              </div>
              <button onClick={() => { signOut(); router.replace('/') }}
                style={{
                  padding: '8px 18px', borderRadius: 99, border: '1px solid var(--line)',
                  background: 'white', fontSize: 14, color: 'var(--ink)', fontWeight: 500, cursor: 'pointer',
                }}
                className="hover:bg-bg transition-colors">
                Sign out
              </button>
            </div>

            {/* Row: delete */}
            <div style={{ padding: '18px 0' }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#C0392B', marginBottom: 3 }}>Danger zone</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Permanently deletes your account and all saved recipes.</p>
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)}
                  style={{
                    padding: '8px 18px', borderRadius: 99, border: '1px solid #F0D5D0',
                    background: '#FDF2F0', fontSize: 14, color: '#C0392B', fontWeight: 500, cursor: 'pointer',
                  }}>
                  Delete account
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={handleDeleteAccount} disabled={deleteLoading}
                    style={{
                      padding: '8px 18px', borderRadius: 99, border: 'none',
                      background: '#C0392B', color: 'white', fontSize: 14, fontWeight: 500,
                      cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1,
                    }}>
                    {deleteLoading ? 'Deleting…' : 'Yes, delete everything'}
                  </button>
                  <button onClick={() => setDeleteConfirm(false)}
                    style={{
                      padding: '8px 16px', borderRadius: 99, border: '1px solid var(--line)',
                      background: 'white', fontSize: 14, cursor: 'pointer', color: 'var(--ink)',
                    }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

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
            {/* Close button */}
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
