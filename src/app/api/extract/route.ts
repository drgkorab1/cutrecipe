import { NextRequest, NextResponse } from 'next/server'
import { validateUrl } from '@/lib/ssrf'
import { extractFromHtml } from '@/lib/extractor'
import { safeFetch, SSRFError, TRACKING_PARAMS } from '@/lib/fetch'
import type { RecipeData } from '@/types/recipe'
import { isYouTubeUrl, extractFromYouTube } from '@/lib/youtube'
import { isTikTokUrl, extractFromTikTok } from '@/lib/tiktok'
import { generateRecipeSummary, generateNutritionEstimate, parseRecipeWithAI } from '@/lib/ai-parser'

// ─── Rate limiting ────────────────────────────────────────────────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT  = 20
const RATE_WINDOW = 60_000

function isRateLimited(ip: string): boolean {
  const now   = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

function normaliseUrl(url: URL): string {
  const clean = new URL(url.toString())
  TRACKING_PARAMS.forEach((p) => clean.searchParams.delete(p))
  return clean.toString()
}

/** Adds AI-generated summary + nutrition to an extracted recipe (non-critical). */
async function enhanceWithAI(recipe: RecipeData): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return
  try {
    const [summary, nutrition] = await Promise.all([
      generateRecipeSummary(recipe),
      generateNutritionEstimate(recipe),
    ])
    recipe.summary   = summary   ?? undefined
    recipe.nutrition = nutrition ?? undefined
  } catch { /* non-critical */ }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests — please wait a minute and try again.' },
      { status: 429 },
    )
  }

  let body: { url?: string; text?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // ─── Paste-text mode: structure raw recipe text without a URL ───────────────
  if (body.text && !body.url) {
    const rawText = body.text.trim()
    if (rawText.length < 20) {
      return NextResponse.json({ error: 'Please paste more text — we need at least a few ingredients or steps.' }, { status: 400 })
    }
    let recipe: RecipeData | null
    try {
      recipe = await parseRecipeWithAI({
        title: 'Pasted Recipe',
        description: rawText,
        author: '',
        sourceUrl: '',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json({ error: 'Server configuration error: AI key not set.' }, { status: 503 })
      }
      return NextResponse.json({ error: 'AI service error — please try again later.' }, { status: 502 })
    }
    if (!recipe) {
      return NextResponse.json({ error: "Couldn't find a recipe in that text. Try including ingredients and steps." }, { status: 422 })
    }
    await enhanceWithAI(recipe)
    return NextResponse.json(recipe)
  }

  const rawUrl = (body.url ?? '').trim()
  if (!rawUrl) {
    return NextResponse.json({ error: 'Please enter a URL.' }, { status: 400 })
  }

  const validation = validateUrl(rawUrl)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const normUrl = normaliseUrl(validation.url)

  // ─── TikTok: bypass page fetch, use oEmbed instead ──────────────────────────
  // TikTok blocks server-side page fetches with a WAF JS challenge.
  // Their oEmbed endpoint is public, key-free, and returns the full caption.
  if (isTikTokUrl(normUrl)) {
    let tikTokResult: import('@/lib/tiktok').TikTokResult
    try {
      tikTokResult = await extractFromTikTok(normUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'Server configuration error: AI key not set.', sourceUrl: normUrl },
          { status: 503 },
        )
      }
      return NextResponse.json(
        { error: 'AI service error — please try again later.', sourceUrl: normUrl },
        { status: 502 },
      )
    }

    if (!tikTokResult.recipe) {
      // Return whatever caption we fetched so the client can pre-fill the text mode
      return NextResponse.json(
        {
          error: "Pro tip: copy the video description and paste it in the \"Paste text\" tab — we'll turn it into a step-by-step recipe.",
          sourceUrl: normUrl,
          caption: tikTokResult.caption || undefined,
        },
        { status: 422 },
      )
    }

    await enhanceWithAI(tikTokResult.recipe)
    return NextResponse.json(tikTokResult.recipe)
  }

  // ─── All other URLs: fetch the page then extract ─────────────────────────────
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), 8_000)

  let html: string
  try {
    const res = await safeFetch(normUrl, controller.signal)
    clearTimeout(timeoutId)

    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      return NextResponse.json(
        { error: 'That URL does not point to an HTML page.', sourceUrl: normUrl },
        { status: 400 },
      )
    }

    html = await res.text()
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof SSRFError)
      return NextResponse.json({ error: 'That URL is not allowed.' }, { status: 400 })
    if (err instanceof Error && err.name === 'AbortError')
      return NextResponse.json(
        { error: 'The page took too long to load. Please try again.', sourceUrl: normUrl },
        { status: 504 },
      )
    return NextResponse.json(
      { error: 'Could not reach that URL. Please check it and try again.', sourceUrl: normUrl },
      { status: 502 },
    )
  }

  let recipe: RecipeData | null
  if (isYouTubeUrl(normUrl)) {
    try {
      recipe = await extractFromYouTube(html, normUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'Server configuration error: AI key not set.', sourceUrl: normUrl },
          { status: 503 },
        )
      }
      return NextResponse.json(
        { error: 'AI service error — please try again later.', sourceUrl: normUrl },
        { status: 502 },
      )
    }
  } else {
    recipe = await extractFromHtml(html, normUrl)
  }

  if (!recipe) {
    return NextResponse.json(
      { error: "We couldn't find a recipe on that page.", sourceUrl: normUrl },
      { status: 422 },
    )
  }

  await enhanceWithAI(recipe)
  return NextResponse.json(recipe)
}
