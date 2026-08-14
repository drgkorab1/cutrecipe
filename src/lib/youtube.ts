// YouTube recipe extraction — server-side only.
// Parses ytInitialPlayerResponse from the page HTML, then delegates
// description parsing to the AI parser.

import type { RecipeData } from '@/types/recipe'
import { parseRecipeWithAI } from './ai-parser'

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
 * YouTube embeds in every watch page.  Uses a brace-counting approach so
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

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Full YouTube extraction pipeline:
 * 1. Parse ytInitialPlayerResponse from page HTML
 * 2. Guard: description < 100 chars → return null (no API call)
 * 3. Delegate to AI parser
 */
export async function extractFromYouTube(
  html: string,
  sourceUrl: string,
): Promise<RecipeData | null> {
  const details = parseYtInitialPlayerResponse(html)
  if (!details) return null

  const { title, shortDescription, author } = details

  if (shortDescription.length < 100) return null

  return parseRecipeWithAI({ title, description: shortDescription, author, sourceUrl })
}
