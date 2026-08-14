// TikTok recipe extraction — server-side only.
//
// Strategy:
//  1. oEmbed      → fast, gets caption + author + video ID (works for all URL formats)
//  2. Main page   → full video description from __UNIVERSAL_DATA_FOR_REHYDRATION__ (may be WAF-blocked)
//  3. embed/v2    → bypasses WAF, gets stickerTextList (on-screen text overlays)
// Sources 2 & 3 run in parallel after oEmbed, all results merged before sending to the AI parser.

import type { RecipeData } from '@/types/recipe'
import { parseRecipeWithAI } from './ai-parser'

// ─── URL detection ────────────────────────────────────────────────────────────

export function isTikTokUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    return host === 'tiktok.com' || host === 'vm.tiktok.com'
  } catch {
    return false
  }
}

// ─── Result type ──────────────────────────────────────────────────────────────

export interface TikTokResult {
  recipe: RecipeData | null
  /** All text we collected — surfaced to the client even on failure so it can
   *  pre-fill the manual text mode. */
  caption: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Extracts the numeric video ID from a standard TikTok URL path. */
function videoIdFromUrl(url: string): string | null {
  return url.match(/\/video\/(\d+)/)?.[1] ?? null
}

interface OEmbedData {
  title?: string
  author_name?: string
  embed_product_id?: string
}

/** Step 1 — oEmbed: caption, author display name, and video ID (handles short URLs too). */
async function fetchOEmbed(sourceUrl: string): Promise<OEmbedData> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(sourceUrl)}`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6_000) },
    )
    if (!res.ok) return {}
    return (await res.json()) as OEmbedData
  } catch {
    return {}
  }
}

/**
 * Step 2a — Main page: full video description from the SSR data blob.
 * TikTok embeds all video metadata in __UNIVERSAL_DATA_FOR_REHYDRATION__ for SEO.
 * This may be blocked by TikTok's WAF when called from cloud IPs — returns ''
 * gracefully in that case so the other sources still work.
 */
async function fetchMainPageDesc(sourceUrl: string): Promise<string> {
  try {
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return ''

    const html = await res.text()
    // WAF challenge pages are tiny — bail out early
    if (html.length < 5_000) return ''

    const m = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
    )
    if (!m?.[1]) return ''

    const data = JSON.parse(m[1]) as Record<string, unknown>

    // TikTok SSR path: webapp.video-detail → body → itemInfo → itemStruct → desc
    const body = (data['webapp.video-detail'] as Record<string, unknown>)?.body as
      | Record<string, unknown>
      | undefined
    const itemStruct = (body?.itemInfo as Record<string, unknown>)?.itemStruct as
      | Record<string, unknown>
      | undefined
    const desc = itemStruct?.desc as string | undefined

    return desc?.trim() ?? ''
  } catch {
    return ''
  }
}

/** Step 2b — embed/v2: parses __FRONTITY_CONNECT_STATE__ for sticker text overlays. */
async function fetchStickerText(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.tiktok.com/embed/v2/${videoId}`, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com',
      },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return ''

    const html = await res.text()

    const scriptMatch = html.match(
      /<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/,
    )
    if (!scriptMatch?.[1]) return ''

    const state = JSON.parse(scriptMatch[1]) as Record<string, unknown>
    const sourceData = (state?.source as Record<string, unknown>)?.data as
      | Record<string, unknown>
      | undefined
    if (!sourceData) return ''

    const videoKey = Object.keys(sourceData).find((k) => k.includes('/embed/v2/'))
    if (!videoKey) return ''

    const itemInfos = (
      (sourceData[videoKey] as Record<string, unknown>)?.videoData as
        | Record<string, unknown>
        | undefined
    )?.itemInfos as Record<string, unknown> | undefined

    const stickers = itemInfos?.stickerTextList as Array<{ text?: string }> | undefined
    if (!stickers?.length) return ''

    return stickers
      .map((s) => s.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
  } catch {
    return ''
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function extractFromTikTok(sourceUrl: string): Promise<TikTokResult> {
  // Run oEmbed first (always) — it resolves short URLs and is very fast.
  const oembed = await fetchOEmbed(sourceUrl)

  const caption = oembed.title?.trim() ?? ''
  const author  = oembed.author_name?.trim() ?? 'TikTok creator'
  const videoId = oembed.embed_product_id ?? videoIdFromUrl(sourceUrl) ?? ''

  // Fetch main page description and sticker text in parallel
  const [mainDesc, stickerText] = await Promise.all([
    fetchMainPageDesc(sourceUrl),
    videoId ? fetchStickerText(videoId) : Promise.resolve(''),
  ])

  // Use the longer of the main page description vs the oEmbed caption as primary text
  const primaryText = mainDesc.length > caption.length ? mainDesc : caption
  const combined = [primaryText, stickerText].filter(Boolean).join('\n\n').trim()

  if (combined.length < 30) {
    return { recipe: null, caption: combined || caption }
  }

  const recipe = await parseRecipeWithAI({
    title: caption || 'TikTok Recipe',
    description: combined,
    author,
    sourceUrl,
  })

  return { recipe, caption: combined }
}
