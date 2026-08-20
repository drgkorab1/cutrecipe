// Instagram recipe extraction — server-side only.
//
// Strategy:
//   Fetch the reel/post page with a search-engine bot User-Agent. Instagram
//   renders full Open Graph meta tags for crawlers (SEO), which includes the
//   complete post caption as og:description. No API key required.
//
//   Optional: if INSTAGRAM_ACCESS_TOKEN is set (Meta app token in the format
//   "{APP_ID}|{APP_SECRET}"), the oEmbed API is also called in parallel and
//   its data takes precedence for author name and thumbnail.

import * as cheerio from 'cheerio'
import type { RecipeData } from '@/types/recipe'
import { parseRecipeWithAI } from './ai-parser'

// ─── URL detection ────────────────────────────────────────────────────────────

export function isInstagramUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    return host === 'instagram.com' && /\/(reel|p)\//.test(u.pathname)
  } catch {
    return false
  }
}

// ─── Result type ──────────────────────────────────────────────────────────────

export interface InstagramResult {
  recipe: RecipeData | null
  /** Caption collected — surfaced even on failure for the auto-submit fallback. */
  caption: string
  coverUrl?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOT_UA     = 'Googlebot/2.1 (+http://www.google.com/bot.html)'
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

interface PageData {
  caption: string
  author:  string
  coverUrl: string
}

/**
 * Instagram og:description format:
 *   "{N} likes, {M} comments - username on Month DD, YYYY: "caption text""
 * Strips the stats prefix and returns the raw caption + author.
 */
function parseOgDescription(desc: string): { caption: string; author: string } {
  const m = desc.match(/^.+?-\s*(.+?)\s+on\s+\w+\s+\d{1,2},\s*\d{4}:\s*["\u201c]?([\s\S]*)$/)
  if (m) {
    return {
      author:  m[1].trim(),
      caption: m[2].replace(/["\u201d]$/, '').trim(),
    }
  }
  return { author: 'Instagram creator', caption: desc }
}

/**
 * Fetches the Instagram post page with a Googlebot User-Agent.
 * Instagram serves fully-rendered Open Graph tags (including the complete
 * caption) to search crawlers for SEO — no authentication required.
 */
async function fetchPageData(sourceUrl: string): Promise<PageData> {
  const empty: PageData = { caption: '', author: '', coverUrl: '' }
  try {
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': BOT_UA },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return empty

    const html = await res.text()
    if (html.length < 5_000) return empty // bot-challenge or login page

    const $        = cheerio.load(html)
    const rawDesc  = $('meta[property="og:description"]').attr('content')?.trim() ?? ''
    const coverUrl = $('meta[property="og:image"]').attr('content')?.trim() ?? ''

    const { caption, author } = parseOgDescription(rawDesc)
    return { caption, author, coverUrl }
  } catch {
    return empty
  }
}

// ─── Optional Meta oEmbed (better author/thumbnail if token is set) ───────────

interface OEmbedData {
  title?:         string
  author_name?:   string
  thumbnail_url?: string
}

async function fetchOEmbed(sourceUrl: string, accessToken: string): Promise<OEmbedData> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/instagram_oembed` +
      `?url=${encodeURIComponent(sourceUrl)}` +
      `&access_token=${encodeURIComponent(accessToken)}` +
      `&fields=title,thumbnail_url,author_name`,
      { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(8_000) },
    )
    if (!res.ok) return {}
    return (await res.json()) as OEmbedData
  } catch {
    return {}
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function extractFromInstagram(sourceUrl: string): Promise<InstagramResult> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

  // Run page scrape + optional oEmbed in parallel
  const [page, oembed] = await Promise.all([
    fetchPageData(sourceUrl),
    accessToken ? fetchOEmbed(sourceUrl, accessToken) : Promise.resolve({} as OEmbedData),
  ])

  // oEmbed takes precedence where available; page data fills the gaps
  const caption  = (oembed.title?.trim() || page.caption).trim()
  const author   = oembed.author_name?.trim() || page.author || 'Instagram creator'
  const coverUrl = oembed.thumbnail_url || page.coverUrl || undefined

  if (caption.length < 30) {
    return { recipe: null, caption, coverUrl }
  }

  const recipe = await parseRecipeWithAI({
    title:       caption.split('\n')[0]?.slice(0, 80) || 'Instagram Recipe',
    description: caption,
    author,
    sourceUrl,
  })

  if (recipe) recipe.coverUrl = coverUrl
  return { recipe, caption, coverUrl }
}
