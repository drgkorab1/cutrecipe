'use client'

import { useState, useEffect } from 'react'
import { Clock, Users, List, ChefHat, ShoppingCart, BarChart2, Ruler } from 'lucide-react'
import type { RecipeData } from '@/types/recipe'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`
}

function parseServings(s: string | null): number {
  if (!s) return 4
  const n = parseInt(s)
  return isNaN(n) || n < 1 ? 4 : n
}

// Scale a numeric value and format it nicely
function scaleValue(n: number, ratio: number): string {
  const result = n * ratio
  if (result === 0) return '0'
  const rounded = Math.round(result * 8) / 8 // round to nearest ⅛
  const whole = Math.floor(rounded)
  const frac = rounded - whole
  const FRACS: [number, string][] = [
    [0, ''], [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'],
    [0.5, '½'], [0.667, '⅔'], [0.75, '¾'], [0.875, '⅞'],
  ]
  let closest = FRACS[0]
  let minDiff = Infinity
  for (const f of FRACS) {
    const diff = Math.abs(frac - f[0])
    if (diff < minDiff) { minDiff = diff; closest = f }
  }
  if (closest[0] === 0) return whole > 0 ? String(whole) : String(Math.round(result * 10) / 10)
  return (whole > 0 ? String(whole) : '') + closest[1]
}

// Strip footnote/annotation markers that recipe sites embed in ingredient strings,
// e.g. "(Note 1)", "(*)", "flour *". Runs client-side so it catches both
// freshly-extracted and previously-cached data.
function cleanIngredient(s: string): string {
  return s
    .replace(/\s*\(\([^)]*\)\)/g, '')            // ((Note 1)) double-paren
    .replace(/\s*\(\s*notes?[\s:][^)]*\)/gi, '')  // (Note 1), (Note: ...)
    .replace(/\s*\(\s*notes?\s*\)/gi, '')          // (Note), (Notes)
    .replace(/\s*\(\s*see\s+[^)]+\)/gi, '')        // (see notes), (see note 1)
    .replace(/\s*\(\s*[*†‡]+\s*\)/g, '')           // (*), (†), (**)
    .replace(/\s*\(\s*\d+\s*\)\s*$/, '')           // trailing bare number (1)
    .replace(/\s*\*+\s*$/, '')                     // trailing asterisks
    .trim()
}

// Scale numbers in an ingredient string, leaving non-quantity text alone
function scaleIngredient(ing: string, ratio: number): string {
  if (Math.abs(ratio - 1) < 0.001) return ing
  return ing.replace(/\b(\d+)\s*\/\s*(\d+)\b|\b(\d+(?:\.\d+)?)\b/g, (match, num, den, whole) => {
    const value = num !== undefined ? parseInt(num) / parseInt(den) : parseFloat(whole)
    if (value > 500) return match
    return scaleValue(value, ratio)
  })
}

// ─── Unit conversion helpers ─────────────────────────────────────────────────

const UNICODE_FRACS: Record<string, number> = {
  '⅛': 0.125, '¼': 0.25, '⅓': 0.333, '½': 0.5,
  '⅔': 0.667, '¾': 0.75, '⅞': 0.875,
}

function normalizeFracs(s: string): string {
  return s.replace(/(\d+)?([⅛¼⅓½⅔¾⅞])/g, (_match, whole, frac) => {
    const decFrac = UNICODE_FRACS[frac] ?? 0
    return whole ? String(parseInt(whole) + decFrac) : String(decFrac)
  })
}

function evalFrac(s: string): number {
  const trimmed = s.trim()
  const slashIdx = trimmed.indexOf('/')
  if (slashIdx !== -1) {
    return parseFloat(trimmed.slice(0, slashIdx)) / parseFloat(trimmed.slice(slashIdx + 1))
  }
  return parseFloat(trimmed)
}

function fmtMl(ml: number): string {
  return ml >= 1000 ? `${Math.round(ml / 100) / 10} L` : `${Math.round(ml)} ml`
}

function fmtG(g: number): string {
  return g >= 1000 ? `${Math.round(g / 100) / 10} kg` : `${Math.round(g)} g`
}

function convertToMetric(s: string): string {
  s = s.replace(/(\d+(?:\.\d+)?)\s*°?\s*F\b/g, (_m, v) =>
    `${Math.round((evalFrac(v) - 32) * 5 / 9)}°C`)
  s = s.replace(/(\d+(?:\.\d+)?)\s*cups?\b/gi, (_m, v) => fmtMl(evalFrac(v) * 240))
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:tablespoons?|tbsps?)\b/gi, (_m, v) => fmtMl(evalFrac(v) * 15))
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:teaspoons?|tsps?)\b/gi, (_m, v) => fmtMl(evalFrac(v) * 5))
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:fl\.?\s*oz|fluid\s+ounces?)\b/gi, (_m, v) => fmtMl(evalFrac(v) * 30))
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:gallons?|gal)\b/gi, (_m, v) =>
    `${Math.round(evalFrac(v) * 3.785 * 10) / 10} L`)
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:quarts?|qt)\b/gi, (_m, v) => fmtMl(evalFrac(v) * 946))
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:pints?|pt)\b/gi, (_m, v) => fmtMl(evalFrac(v) * 473))
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)\b/gi, (_m, v) => fmtG(evalFrac(v) * 454))
  s = s.replace(/(\d+(?:\.\d+)?)\s*oz\b/gi, (_m, v) => fmtG(evalFrac(v) * 28))
  return s
}

// ─── YouTube thumbnail ───────────────────────────────────────────────────────

function getYouTubeThumbnail(url: string): string | null {
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecipeCard({ data }: { data: RecipeData }) {
  const { title, author, authorUrl, sourceUrl, ingredients, steps, totalMinutes, servings, summary, nutrition } = data

  const { user, openAuthModal } = useAuth()
  const supabase = createClient()

  const originalServings = parseServings(servings)
  const [servingCount, setServingCount] = useState(originalServings)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [stepsChecked, setStepsChecked] = useState<Set<number>>(new Set())
  const [shared, setShared] = useState(false)
  const [shareError, setShareError] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [useMetric, setUseMetric] = useState(false)
  const [openPanel, setOpenPanel] = useState<'shopping' | 'nutrition' | null>(null)
  const [copiedList, setCopiedList] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Check if already saved when user is available
  useEffect(() => {
    if (!user || !sourceUrl) return
    supabase
      .from('user_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('source_url', sourceUrl)
      .maybeSingle()
      .then(({ data }) => { if (data) setSaved(true) })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const thumbnail = getYouTubeThumbnail(sourceUrl)
  const ratio = servingCount / originalServings
  const authorName = author ?? 'the original author'
  const servingsLabel = servingCount === 1 ? '1 serving' : `${servingCount} servings`

  function displayIng(ing: string): string {
    const clean = cleanIngredient(ing)
    const scaled = scaleIngredient(clean, ratio)
    return useMetric ? convertToMetric(normalizeFracs(scaled)) : scaled
  }

  function toggleCheck(i: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleStepCheck(i: number) {
    setStepsChecked((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.slug) {
        setShareError(true)
        setTimeout(() => setShareError(false), 2500)
        return
      }
      const shareUrl = `${window.location.origin}/shared/${json.slug}`
      await navigator.clipboard?.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2500)
    } finally {
      setSharing(false)
    }
  }

  function togglePanel(panel: 'shopping' | 'nutrition') {
    setOpenPanel((prev) => (prev === panel ? null : panel))
  }

  async function handleSave() {
    if (!user) {
      openAuthModal()
      return
    }
    if (saved || saving) return
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase.from('user_recipes').insert({
      user_id: user.id,
      title,
      author: author ?? null,
      source_url: sourceUrl,
      ingredients: ingredients,
      steps: steps,
      total_minutes: totalMinutes ?? null,
      servings: servings ?? null,
    })
    setSaving(false)
    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
    }
  }

  function handleCopyList() {
    const items = ingredients
      .filter((_, i) => checked.size === 0 || !checked.has(i))
      .map((ing) => `• ${displayIng(ing)}`)
      .join('\n')
    navigator.clipboard?.writeText(`${title}\n\n${items}`)
    setCopiedList(true)
    setTimeout(() => setCopiedList(false), 2000)
  }

  const shoppingItems = ingredients.filter((_, i) => checked.size === 0 || !checked.has(i))

  // Shared pill style helper
  const pillBase = 'flex cursor-pointer items-center gap-[7px] border px-[14px] py-[7px] text-[13.5px] transition-all active:scale-[0.97]'
  const pillInactive = 'border-line bg-white text-muted hover:border-ink/30 hover:text-ink'
  const pillAccentBorder = 'border-accent/40 bg-white text-muted hover:bg-accent-soft hover:text-accent hover:border-accent/60'

  function pillActive(active: boolean, inactive = pillInactive) {
    return active
      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
      : inactive
  }

  return (
    <article
      className="mx-auto overflow-hidden bg-card text-left"
      style={{
        maxWidth: 1020,
        borderRadius: 20,
        border: '1px solid var(--line)',
        boxShadow: '0 20px 50px -30px rgba(30,27,24,.4)',
      }}
    >
      {/* ── Attribution strip ──────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-[14px] sm:px-[26px]"
        style={{ background: '#FCF9F5', borderBottom: '1px solid var(--line)' }}
      >
        <p className="text-[14px] text-muted">
          Recipe by{' '}
          {authorUrl ? (
            <a href={authorUrl} target="_blank" rel="noopener noreferrer"
              className="font-bold text-ink underline underline-offset-2 hover:no-underline">
              {authorName}
            </a>
          ) : (
            <b className="font-bold text-ink">{authorName}</b>
          )}{' '}
          — we only show the ingredients and steps.
        </p>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-[14px] font-semibold text-accent hover:underline">
          Read the original ↗
        </a>
      </div>

      {/* ── Card body ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-[26px] pb-9 sm:px-[34px] sm:pt-[30px]">

        {/* Title + optional YouTube thumbnail + summary */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4" style={{ marginBottom: 14 }}>
          {thumbnail && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="sm:shrink-0 sm:mt-1">
              <img
                src={thumbnail}
                alt={`${title} video thumbnail`}
                className="rounded-xl object-cover w-full h-[180px] sm:w-[250px] sm:h-[150px]"
                style={{ border: '1px solid rgba(192,83,42,.35)' }}
              />
            </a>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4" style={{ marginBottom: summary ? 14 : 0 }}>
              <h2 className="font-serif font-semibold text-ink min-w-0"
                style={{ fontSize: 'clamp(22px, 5.5vw, 34px)', lineHeight: 1.12 }}>
                {title}
              </h2>
              {/* Primary save button */}
              <button
                onClick={handleSave}
                disabled={saved || saving}
                className="flex w-full items-center justify-center sm:w-auto sm:shrink-0"
                style={{
                  gap: 7,
                  padding: '10px 20px',
                  borderRadius: 99,
                  border: 'none',
                  background: saved ? 'var(--accent-soft)' : 'var(--accent)',
                  color: saved ? 'var(--accent)' : 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saved || saving ? 'default' : 'pointer',
                  boxShadow: saved ? 'none' : '0 4px 14px -4px rgba(192,83,42,.5)',
                  transition: 'all .15s',
                }}
              >
                {/* star icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {saving ? 'Saving…' : saved ? 'Saved' : 'Save recipe'}
              </button>
            </div>
            {saveError && (
              <p style={{ fontSize: 13, color: '#C0392B', marginBottom: 6 }}>
                Could not save: {saveError}
              </p>
            )}
            {summary && (
              <p className="text-muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-col mb-8 sm:mb-5" style={{ gap: 8, marginTop: 22 }}>
        <span className="font-sans font-bold uppercase tracking-[.1em] text-accent" style={{ fontSize: 11 }}>Overview</span>
        <div className="flex flex-wrap items-center text-muted"
          style={{ gap: 20, fontSize: 14.5 }}>
          {totalMinutes != null && (
            <span className="flex items-center gap-[6px]"><Clock size={14} strokeWidth={1.75} />{formatMinutes(totalMinutes)} total</span>
          )}
          {servings && (
            <span className="flex items-center gap-[6px]"><Users size={14} strokeWidth={1.75} />Serves {servingCount}</span>
          )}
          {ingredients.length > 0 && (
            <span className="flex items-center gap-[6px]"><List size={14} strokeWidth={1.75} />{ingredients.length} ingredients</span>
          )}
          {steps.length > 0 && (
            <span className="flex items-center gap-[6px]"><ChefHat size={14} strokeWidth={1.75} />{steps.length} steps</span>
          )}
        </div>
        </div>

        {/* Tool row — left: recipe actions · right: utilities */}
        <div className="flex flex-wrap items-start justify-between gap-y-6 gap-x-3 sm:gap-y-3 sm:gap-x-3" style={{ paddingBottom: 20 }}>

          {/* Left group: serving + shopping + nutrition */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span className="font-sans font-bold uppercase tracking-[.1em] text-accent" style={{ fontSize: 11 }}>Make it yours</span>
          <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
            <div className="flex items-center overflow-hidden border border-accent/40 bg-white"
              style={{ borderRadius: 99 }}>
              <button
                onClick={() => setServingCount((n) => Math.max(1, n - 1))}
                className="cursor-pointer border-0 bg-transparent px-[13px] py-[7px] text-[15px] text-accent/70 transition-all hover:text-accent active:scale-90"
                aria-label="Decrease servings"
              >−</button>
              <span className="px-[6px] text-[13.5px] text-muted">{servingsLabel}</span>
              <button
                onClick={() => setServingCount((n) => n + 1)}
                className="cursor-pointer border-0 bg-transparent px-[13px] py-[7px] text-[15px] text-accent/70 transition-all hover:text-accent active:scale-90"
                aria-label="Increase servings"
              >+</button>
            </div>

            <button
              onClick={() => togglePanel('shopping')}
              className={`${pillBase} ${pillActive(openPanel === 'shopping', pillAccentBorder)}`}
              style={{ borderRadius: 99 }}
            >
              <ShoppingCart size={13} strokeWidth={1.75} className="text-accent/70" />Shopping list
            </button>

            <button
              onClick={() => togglePanel('nutrition')}
              className={`${pillBase} ${pillActive(openPanel === 'nutrition', pillAccentBorder)}`}
              style={{ borderRadius: 99 }}
            >
              <BarChart2 size={13} strokeWidth={1.75} className="text-accent/70" />Nutrition
            </button>
          </div>
          </div>

          {/* Right group: imperial + print + share */}
          <div className="flex flex-col items-start" style={{ gap: 8 }}>
            <span className="font-sans font-bold uppercase tracking-[.1em] text-accent" style={{ fontSize: 11 }}>Export</span>
          <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
            <button
              onClick={() => setUseMetric((v) => !v)}
              className={`${pillBase} ${pillActive(useMetric, pillAccentBorder)} justify-center`}
              style={{ borderRadius: 99, minWidth: 108 }}
              aria-pressed={useMetric}
            >
              <Ruler size={13} strokeWidth={1.75} className="text-accent/70" />{useMetric ? 'Metric' : 'Imperial'}
            </button>

            <button onClick={() => window.print()}
              className={`${pillBase} ${pillAccentBorder}`}
              style={{ borderRadius: 99 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-accent/70">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>

            <button onClick={handleShare} disabled={sharing}
              className={`${pillBase} ${shareError ? 'border-red-300 bg-red-50 text-red-500' : pillAccentBorder}`}
              style={{ borderRadius: 99 }}>
              {shared ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Link copied!
                </>
              ) : shareError ? (
                'Failed — run SQL migration'
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-accent/70">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  {sharing ? 'Sharing…' : 'Share'}
                </>
              )}
            </button>

          </div>
          </div>
        </div>

        {/* ── Expandable panels (below tool row, above columns) ─────────── */}
        {openPanel === 'shopping' && (
          <div className="rounded-xl" style={{ background: '#FAF7F3', padding: '16px 20px', marginBottom: 24, border: '1px solid var(--line)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <span className="font-semibold text-ink" style={{ fontSize: 14 }}>Shopping list</span>
              <button
                onClick={handleCopyList}
                className="flex cursor-pointer items-center gap-[5px] transition-colors"
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 99,
                  border: '1px solid var(--line)',
                  background: copiedList ? 'var(--accent-soft)' : 'white',
                  color: copiedList ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {copiedList ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy list
                  </>
                )}
              </button>
            </div>
            <ul className="list-none" style={{ margin: 0, padding: 0 }}>
              {shoppingItems.map((ing, idx) => (
                <li key={idx} style={{
                  fontSize: 14.5, color: 'var(--ink)', padding: '5px 0',
                  borderBottom: idx < shoppingItems.length - 1 ? '1px dashed #EDE5DB' : 'none',
                }}>
                  {displayIng(ing)}
                </li>
              ))}
              {shoppingItems.length === 0 && (
                <li style={{ fontSize: 14, color: 'var(--muted)' }}>All ingredients are checked off.</li>
              )}
            </ul>
          </div>
        )}

        {openPanel === 'nutrition' && (
          <div className="rounded-xl" style={{ background: '#FAF7F3', padding: '16px 20px', marginBottom: 24, border: '1px solid var(--line)' }}>
            <div style={{ marginBottom: 12 }}>
              <span className="font-semibold text-ink" style={{ fontSize: 14 }}>Nutrition per serving</span>
            </div>
            {nutrition ? (
              <>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: nutrition.calories, label: 'cal' },
                    { value: nutrition.proteinG,  label: 'protein' },
                    { value: nutrition.carbsG,    label: 'carbs' },
                    { value: nutrition.fatG,      label: 'fat' },
                    ...(nutrition.fiberG !== undefined ? [{ value: nutrition.fiberG, label: 'fiber' }] : []),
                  ].map(({ value, label }) => (
                    <div key={label} className="rounded-lg flex flex-col items-center"
                      style={{ background: 'white', border: '1px solid var(--line)', padding: '10px 18px', minWidth: 64 }}>
                      <span className="font-bold text-ink" style={{ fontSize: 22, lineHeight: 1.1 }}>
                        {value}
                        {label !== 'cal' && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}> g</span>}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{label}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#B0A499', marginTop: 10, marginBottom: 0 }}>
                  AI estimate — not for medical use
                </p>
              </>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                Nutrition data not available. Re-extract the recipe to generate an estimate.
              </p>
            )}
          </div>
        )}

        {/* ── Two-column layout ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_3fr]"
          style={{ gap: '0 40px', borderTop: '1px solid var(--line)', paddingTop: 30 }}>

          {/* Ingredients — sticky on desktop */}
          <div className="sm:sticky sm:top-6 sm:self-start">
            <h3 className="font-sans font-bold uppercase tracking-[.1em] text-muted"
              style={{ fontSize: 13, marginBottom: 4 }}>
              Ingredients
              {ratio !== 1 && (
                <span className="ml-2 font-normal normal-case tracking-normal text-accent" style={{ fontSize: 12 }}>
                  scaled ×{ratio % 1 === 0 ? ratio : ratio.toFixed(2)}
                </span>
              )}
            </h3>
            <p style={{ fontSize: 11.5, color: '#B0A499', marginBottom: 12 }}>Tap an item to check it off</p>
            {ingredients.length > 0 ? (
              <ul className="list-none rounded-xl"
                style={{ background: '#FAF7F3', padding: '4px 16px 4px' }}>
                {ingredients.map((ing, i) => (
                  <li key={i}
                    className="flex cursor-pointer items-start border-b border-dashed border-[#EDE5DB] last:border-0"
                    style={{ gap: 11, padding: '10px 0', fontSize: 16.5 }}
                    onClick={() => toggleCheck(i)}>
                    <span
                      className="mt-[3px] shrink-0 rounded-[5px] transition-colors"
                      style={{
                        width: 19, height: 19, flexShrink: 0,
                        border: checked.has(i) ? '1.5px solid var(--accent)' : '1.5px solid #CDBFAF',
                        background: checked.has(i) ? 'var(--accent-soft)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      aria-hidden="true">
                      {checked.has(i) && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </span>
                    <span className="transition-colors" style={{
                      color: checked.has(i) ? 'var(--muted)' : 'var(--ink)',
                      textDecoration: checked.has(i) ? 'line-through' : 'none',
                    }}>
                      {displayIng(ing)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-muted">No ingredients listed.</p>
            )}
          </div>

          {/* Method — timeline style */}
          <div>
            <h3 className="font-sans font-bold uppercase tracking-[.1em] text-muted"
              style={{ fontSize: 13, marginBottom: 4 }}>
              Method
            </h3>
            <p style={{ fontSize: 11.5, color: '#B0A499', marginBottom: 16 }}>Tap a step to mark it done</p>
            {steps.length > 0 ? (
              <ol className="list-none">
                {steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex cursor-pointer"
                    style={{ gap: 16, paddingBottom: 28, position: 'relative' }}
                    onClick={() => toggleStepCheck(i)}
                  >
                    {i < steps.length - 1 && (
                      <div style={{
                        position: 'absolute', left: 12, top: 28, bottom: 0,
                        width: 1, background: 'var(--line)',
                      }} />
                    )}
                    <span
                      className="shrink-0 rounded-full text-[13px] font-bold transition-colors"
                      style={{
                        width: 26, height: 26, minWidth: 26,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 1, position: 'relative', zIndex: 1,
                        background: stepsChecked.has(i) ? 'var(--accent)' : 'var(--accent-soft)',
                        color: stepsChecked.has(i) ? 'white' : 'var(--accent)',
                      }}
                      aria-hidden="true">
                      {stepsChecked.has(i) ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : i + 1}
                    </span>
                    <p
                      className="text-[15.5px] leading-[1.68] transition-colors"
                      style={{
                        paddingTop: 2,
                        color: stepsChecked.has(i) ? 'var(--muted)' : 'var(--ink)',
                        textDecoration: stepsChecked.has(i) ? 'line-through' : 'none',
                      }}
                    >{useMetric ? convertToMetric(normalizeFracs(step)) : step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[15px] text-muted">No steps listed.</p>
            )}
          </div>

        </div>
      </div>
    </article>
  )
}
