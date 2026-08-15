// YouTube recipe extraction — server-side only.
// Parses ytInitialPlayerResponse from the page HTML, then delegates
// description or transcript parsing to the AI parser.

import type { RecipeData } from '@/types/recipe'
import { parseRecipeWithAI } from './ai-parser'
import { YoutubeTranscript } from 'youtube-transcript'

// ─── URL detection ────────────────────────────────────────────────────────────

export function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' && u.pathname === '/watch' && u.searchParams.has('v')) return true
    if (host === 'youtu.be' && u.pathname.length > 1) return true
    return false
  } catch {
    return false
  }
}

// ─── ytInitialPlayerResponse parser ──────────────────────────────────────────

interface YtVideoDetails {
  title: string
  shortDescription: string
  author: string
}

/**
 * Extracts videoDetails from the ytInitialPlayerResponse JSON blob that
 * YouTube embeds in every watch page. Uses a brace-counting approach so
 * it works without a full JSON parser on the raw script content (which
 * contains embedded JS that JSON.parse would reject).
 */
export function parseYtInitialPlayerResponse(html: string): YtVideoDetails | null {
  const marker = 'ytInitialPlayerResponse'
  const startIdx = html.indexOf(marker)
  if (startIdx === -1) return null

  // Find the opening brace after the marker (ytInitialPlayerResponse = { ... }
  // or ytInitialPlayerResponse={...})
  const braceStart = html.indexOf('{', startIdx + marker.length)
  if (braceStart === -1) return null

  // Walk forward counting braces, skipping strings so embedded { } don't count
  let depth = 0
  let inString = false
  let escape = false
  let i = braceStart

  for (; i < html.length; i++) {
    const ch = html[i]

    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) break
    }
  }

  const jsonStr = html.slice(braceStart, i + 1)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>
  } catch {
    return null
  }

  const vd = (parsed as { videoDetails?: unknown }).videoDetails
  if (!vd || typeof vd !== 'object') return null

  const details = vd as Record<string, unknown>
  const title = typeof details.title === 'string' ? details.title : null
  const shortDescription = typeof details.shortDescription === 'string' ? details.shortDescription : null
  const author = typeof details.author === 'string' ? details.author : null

  if (!title || shortDescription === null) return null

  return { title, shortDescription, author: author ?? 'YouTube' }
}

// ─── Transcript fetcher ───────────────────────────────────────────────────────

const MAX_TRANSCRIPT_CHARS = 6000

/**
 * Fetches the transcript for a YouTube video URL using the youtube-transcript
 * package (Android InnerTube client — works server-side without cookies).
 * Returns joined plain text capped at MAX_TRANSCRIPT_CHARS, or null on failure.
 */
async function fetchTranscriptText(sourceUrl: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(sourceUrl, { lang: 'en' })
    if (!segments || segments.length === 0) return null
    return segments.map(s => s.text).join(' ').slice(0, MAX_TRANSCRIPT_CHARS)
  } catch {
    return null
  }
}

// ─── YouTube Data API v3 ──────────────────────────────────────────────────────

function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' && u.pathname === '/watch') return u.searchParams.get('v')
    if (host === 'youtu.be') return u.pathname.slice(1) || null
    return null
  } catch {
    return null
  }
}

/**
 * Fetches video title + description via the YouTube Data API v3.
 * Requires YOUTUBE_API_KEY env var. Returns null if key is absent or
 * the video has no usable description.
 */
export async function extractFromYouTubeAPI(sourceUrl: string): Promise<RecipeData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  const videoId = getYouTubeVideoId(sourceUrl)
  if (!videoId) return null

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`
  )
  if (!res.ok) return null

  const data = await res.json() as {
    items?: Array<{ snippet: { title: string; description: string; channelTitle: string } }>
  }

  const item = data.items?.[0]
  if (!item) return null

  const { title, description, channelTitle } = item.snippet
  if (!description || description.length < 100) return null

  return parseRecipeWithAI({ title, description, author: channelTitle, sourceUrl })
}

// ─── Orchestrator (HTML scrape path) ──────────────────────────────────────────

/**
 * Full YouTube extraction pipeline via page HTML:
 * 1. Parse ytInitialPlayerResponse from page HTML
 * 2. If description >= 100 chars → send to AI parser
 * 3. Otherwise fall back to transcript (caption track) if available
 */
export async function extractFromYouTube(
  html: string,
  sourceUrl: string,
): Promise<RecipeData | null> {
  const details = parseYtInitialPlayerResponse(html)
  if (!details) return null

  const { title, shortDescription, author } = details

  if (shortDescription.length >= 100) {
    const result = await parseRecipeWithAI({ title, description: shortDescription, author, sourceUrl })
    if (result) return result
    // Description had no recipe — fall through to transcript
  }

  // Description absent, short, or contained no recipe — try the video transcript instead
  const transcript = await fetchTranscriptText(sourceUrl)
  if (!transcript || transcript.length < 100) return null

  return parseRecipeWithAI({ title, description: transcript, author, sourceUrl, isTranscript: true })
}
