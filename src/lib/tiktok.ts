// TikTok recipe extraction — server-side only.
//
// Strategy:
//  1. oEmbed      → fast, gets caption + author + video ID (works for all URL formats)
//  2. Main page   → full video description from __UNIVERSAL_DATA_FOR_REHYDRATION__ (may be WAF-blocked)
//  3. embed/v2    → bypasses WAF; extracts stickerTextList (on-screen text) and
//                   subtitleInfos (auto-generated VTT captions, similar to YouTube transcripts)
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
  /** Cover image URL from TikTok CDN (may expire after a few hours). */
  coverUrl?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Returns true for TikTok photo carousel/slideshow posts (vs. video posts). */
function isPhotoPost(url: string): boolean {
  return /\/photo\/\d+/.test(url)
}

/** Extracts the numeric video ID from a standard TikTok URL path. */
function videoIdFromUrl(url: string): string | null {
  return url.match(/\/video\/(\d+)/)?.[1] ?? null
}

// ─── TikWm API (photo posts) ──────────────────────────────────────────────────

interface TikWmData {
  caption: string
  author: string
  coverUrl: string
}

/**
 * Fetches post caption, author, and cover image from TikWm's free public API.
 * Works for both video and photo carousel posts.
 */
async function fetchTikWmData(sourceUrl: string): Promise<TikWmData> {
  const empty: TikWmData = { caption: '', author: '', coverUrl: '' }
  try {
    const res = await fetch(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(sourceUrl)}`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) },
    )
    if (!res.ok) return empty

    const json = (await res.json()) as { code?: number; data?: Record<string, unknown> }
    if (json.code !== 0 || !json.data) return empty

    const d = json.data
    const caption  = (d.title as string | undefined)?.trim() ?? ''
    const authorObj = d.author as Record<string, unknown> | undefined
    const author   = (authorObj?.nickname as string | undefined)?.trim() ?? ''
    // Prefer origin_cover (unmodified); fall back to cover
    const coverUrl = (d.origin_cover as string | undefined) ?? (d.cover as string | undefined) ?? ''

    return { caption, author, coverUrl }
  } catch {
    return empty
  }
}

// ─── Photo post handler ───────────────────────────────────────────────────────

/**
 * Handles TikTok photo carousel posts.
 * Uses TikWm's free public API to get the post caption — many recipe creators
 * include the full recipe as text in the caption alongside the images.
 */
async function extractFromTikTokPhoto(sourceUrl: string): Promise<TikTokResult> {
  const tikwm = await fetchTikWmData(sourceUrl)
  const caption  = tikwm.caption
  const author   = tikwm.author || 'TikTok creator'
  const coverUrl = tikwm.coverUrl || undefined

  if (caption.length < 30) {
    return { recipe: null, caption, coverUrl }
  }

  const recipe = await parseRecipeWithAI({
    title: caption.split('\n')[0]?.slice(0, 80) || 'TikTok Recipe',
    description: caption,
    author,
    sourceUrl,
  })

  if (recipe) recipe.coverUrl = coverUrl
  return { recipe, caption, coverUrl }
}

interface OEmbedData {
  title?: string
  author_name?: string
  embed_product_id?: string
  thumbnail_url?: string
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

interface SubtitleInfo {
  LanguageCodeName?: string
  Url?: string
  Format?: string
}

/** Strips WebVTT timestamps and metadata, returning plain joined text. */
function parseVtt(vtt: string): string {
  return vtt
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      return t && t !== 'WEBVTT' && !/^\d{2}:\d{2}/.test(t) && !/^NOTE/.test(t)
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Fetches the first available (preferably English) VTT caption file. */
async function fetchCaptionText(subtitleInfos: SubtitleInfo[]): Promise<string> {
  const preferred =
    subtitleInfos.find((s) => s.LanguageCodeName?.startsWith('eng')) ?? subtitleInfos[0]
  if (!preferred?.Url) return ''
  try {
    const res = await fetch(preferred.Url, { signal: AbortSignal.timeout(5_000) })
    if (!res.ok) return ''
    const vtt = await res.text()
    return parseVtt(vtt).slice(0, 6_000)
  } catch {
    return ''
  }
}

/**
 * Step 2b — embed/v2: parses __FRONTITY_CONNECT_STATE__ for:
 *   - stickerTextList (on-screen text overlays)
 *   - subtitleInfos   (auto-generated VTT captions, fetched and parsed)
 */
async function fetchEmbedContent(videoId: string): Promise<{ stickerText: string; captionText: string }> {
  const empty = { stickerText: '', captionText: '' }
  try {
    const res = await fetch(`https://www.tiktok.com/embed/v2/${videoId}`, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com',
      },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return empty

    const html = await res.text()

    const scriptMatch = html.match(
      /<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/,
    )
    if (!scriptMatch?.[1]) return empty

    const state = JSON.parse(scriptMatch[1]) as Record<string, unknown>
    const sourceData = (state?.source as Record<string, unknown>)?.data as
      | Record<string, unknown>
      | undefined
    if (!sourceData) return empty

    const videoKey = Object.keys(sourceData).find((k) => k.includes('/embed/v2/'))
    if (!videoKey) return empty

    const videoData = (sourceData[videoKey] as Record<string, unknown>)?.videoData as
      | Record<string, unknown>
      | undefined
    const itemInfos = videoData?.itemInfos as Record<string, unknown> | undefined

    // Sticker text overlays
    const stickers = itemInfos?.stickerTextList as Array<{ text?: string }> | undefined
    const stickerText = stickers?.length
      ? stickers.map((s) => s.text?.trim() ?? '').filter(Boolean).join('\n')
      : ''

    // Auto-generated captions — check multiple possible data paths
    const subtitleInfos: SubtitleInfo[] =
      (itemInfos?.video as Record<string, unknown> | undefined)?.subtitleInfos as SubtitleInfo[] ??
      (videoData?.subtitleInfos as SubtitleInfo[] | undefined) ??
      []

    const captionText = subtitleInfos.length ? await fetchCaptionText(subtitleInfos) : ''

    return { stickerText, captionText }
  } catch {
    return empty
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function extractFromTikTok(sourceUrl: string): Promise<TikTokResult> {
  // Photo carousels have no video/audio — route to the image-based handler.
  if (isPhotoPost(sourceUrl)) {
    return extractFromTikTokPhoto(sourceUrl)
  }

  // Run oEmbed first (always) — it resolves short URLs and is very fast.
  const oembed = await fetchOEmbed(sourceUrl)

  const caption = oembed.title?.trim() ?? ''
  const author  = oembed.author_name?.trim() ?? 'TikTok creator'
  const videoId = oembed.embed_product_id ?? videoIdFromUrl(sourceUrl) ?? ''

  // Fetch main page description, embed content, and TikWm cover in parallel
  const [mainDesc, embedContent, tikwm] = await Promise.all([
    fetchMainPageDesc(sourceUrl),
    videoId ? fetchEmbedContent(videoId) : Promise.resolve({ stickerText: '', captionText: '' }),
    fetchTikWmData(sourceUrl),
  ])
  // oEmbed thumbnail_url is direct from TikTok — more reliable than TikWm CDN
  const coverUrl = oembed.thumbnail_url || tikwm.coverUrl || undefined

  const { stickerText, captionText } = embedContent

  // Use the longest available description as primary text
  const primaryText = [mainDesc, caption].reduce((a, b) => (b.length > a.length ? b : a), '')

  // Build combined text. When VTT captions are present, label each section clearly
  // so the AI can pull ingredients from the description and steps from the transcript.
  let combined: string
  if (captionText) {
    const parts: string[] = []
    if (primaryText) parts.push(`Description:\n${primaryText}`)
    if (stickerText) parts.push(`On-screen text:\n${stickerText}`)
    parts.push(`Transcript (spoken):\n${captionText}`)
    combined = parts.join('\n\n').trim()
  } else {
    combined = [primaryText, stickerText].filter(Boolean).join('\n\n').trim()
  }

  if (combined.length < 30) {
    return { recipe: null, caption: combined || caption, coverUrl }
  }

  // Use transcript mode whenever we have spoken captions — the AI prompt handles
  // conversational language better and looks for steps across both sections.
  const isTranscript = captionText.length > 0

  const recipe = await parseRecipeWithAI({
    title: caption || 'TikTok Recipe',
    description: combined,
    author,
    sourceUrl,
    isTranscript,
  })

  if (recipe) recipe.coverUrl = coverUrl
  return { recipe, caption: combined, coverUrl }
}
