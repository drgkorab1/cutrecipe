// Server-only — do not import from client components.
// Uses cheerio (Node.js) for HTML parsing.
//
// Relative import (not @/ alias) so this file can be used from the
// CLI test script (scripts/test-extract.ts) via tsx without path-alias config.

import * as cheerio from 'cheerio'
import type { RecipeData } from '../types/recipe'

export type { RecipeData }

// ─── HTML stripping ───────────────────────────────────────────────────────────
// Some sites embed HTML markup inside JSON-LD strings, e.g.
//   "text": "<p>Cook the onions until soft.</p>"
// We strip tags and decode the most common entities before returning text.
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')    // remove tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ─── Ingredient cleaner ────────────────────────────────────────────────────────
// Many recipe sites append footnote/annotation markers to ingredient strings,
// e.g. "2 cups flour (Note 1)", "1 tsp salt (*)", "butter (see notes)".
// Strip them so they don't appear in the UI.
export function cleanIngredient(s: string): string {
  return s
    // Double-paren variants: ((Note 1)), ((1))
    .replace(/\s*\(\([^)]*\)\)/g, '')
    // (Note 1), (Note A), (Note: ...) — case-insensitive
    .replace(/\s*\(\s*notes?[\s:][^)]*\)/gi, '')
    .replace(/\s*\(\s*notes?\s*\)/gi, '')
    // (see notes), (see note 1), (see above)
    .replace(/\s*\(\s*see\s+[^)]+\)/gi, '')
    // bare symbol annotations: (*), (†), (**), (‡)
    .replace(/\s*\(\s*[*†‡]+\s*\)/g, '')
    // bare number annotations at end of string: (1), (2)
    .replace(/\s*\(\s*\d+\s*\)\s*$/, '')
    // trailing asterisks: "butter*", "flour **"
    .replace(/\s*\*+\s*$/, '')
    .trim()
}

// ─── ISO 8601 duration → minutes ─────────────────────────────────────────────
// Handles: PT30M · PT1H30M · P1DT2H · P0DT0H45M · PT1H · P2D
function parseISO8601(duration: unknown): number | null {
  if (typeof duration !== 'string' || !duration) return null
  const m = duration.match(
    /P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?/,
  )
  if (!m) return null
  const days  = parseFloat(m[1] ?? '0')
  const hours = parseFloat(m[2] ?? '0')
  const mins  = parseFloat(m[3] ?? '0')
  // Seconds intentionally ignored (not useful in cooking context)
  const result = Math.round(days * 1440 + hours * 60 + mins)
  return result > 0 ? result : null
}

// ─── recipeYield normalisation ────────────────────────────────────────────────
// Accepts: number · "4 servings" · ["4"] · ["4 servings", "4"]
function normaliseYield(raw: unknown): string | null {
  if (raw == null) return null
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'string') return raw.trim() || null
  if (Array.isArray(raw) && raw.length > 0) return String(raw[0]).trim() || null
  return null
}

// ─── recipeInstructions normalisation ────────────────────────────────────────
// Handles all four shapes from §3.1:
//   1. Plain string          "Step 1. Do this. Step 2. Do that."
//   2. String[]              ["Step 1", "Step 2"]
//   3. HowToStep[]           [{ "@type":"HowToStep", "text":"..." }, ...]
//   4. HowToSection[]        [{ "@type":"HowToSection", "itemListElement":[...] }]
//   (plus mixed arrays and objects with only .name)
function normaliseInstructions(raw: unknown): string[] {
  if (!raw) return []

  if (typeof raw === 'string') {
    const clean = stripHtml(raw)
    if (!clean) return []
    // Split on blank lines first, then on numbered-list line starts
    return clean
      .split(/\n{2,}|\r\n{2,}/)
      .flatMap((chunk) =>
        chunk
          .split(/\n/)
          .map((line) => line.replace(/^\s*\d+[\.\)]\s*/, '').trim())
          .filter(Boolean),
      )
      .filter(Boolean)
  }

  if (!Array.isArray(raw)) return []

  const steps: string[] = []

  for (const item of raw) {
    if (typeof item === 'string') {
      const t = stripHtml(item)
      if (t) steps.push(t)
      continue
    }

    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      const type = obj['@type']

      if (type === 'HowToSection') {
        // Section name is a heading, not a step — skip it.
        // Recurse only into itemListElement.
        const sub = obj.itemListElement
        if (Array.isArray(sub)) steps.push(...normaliseInstructions(sub))
        continue
      }

      // HowToStep (or untyped object): prefer .text, fall back to .name
      const textRaw =
        typeof obj.text === 'string' ? obj.text :
        typeof obj.name === 'string' ? obj.name :
        null
      if (textRaw) {
        const t = stripHtml(textRaw)
        if (t) steps.push(t)
      }
    }
  }

  return steps
}

// ─── author normalisation ─────────────────────────────────────────────────────
// Accepts: string · { name, url } · [{ name, url }]
function normaliseAuthor(raw: unknown): { author: string | null; authorUrl: string | null } {
  if (!raw) return { author: null, authorUrl: null }

  const first = Array.isArray(raw) ? raw[0] : raw

  if (typeof first === 'string') {
    return { author: first.trim() || null, authorUrl: null }
  }

  if (first && typeof first === 'object') {
    const obj = first as Record<string, unknown>
    return {
      author:    typeof obj.name === 'string' ? obj.name.trim() || null : null,
      authorUrl: typeof obj.url  === 'string' ? obj.url.trim()  || null : null,
    }
  }

  return { author: null, authorUrl: null }
}

// ─── JSON-LD tree walker ──────────────────────────────────────────────────────
// Finds the first node where @type === "Recipe" (or an array including "Recipe").
// Handles: top-level object · array · @graph nesting · @graph inside an array item.
export function findRecipe(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item)
      if (found) return found
    }
    return null
  }

  const obj = node as Record<string, unknown>
  const type = obj['@type']

  const isRecipe =
    type === 'Recipe' ||
    (Array.isArray(type) && (type as string[]).includes('Recipe'))

  if (isRecipe) return obj

  // Descend into @graph (may be an array or a single object)
  if (obj['@graph']) return findRecipe(obj['@graph'])

  return null
}

// ─── JSON-LD block inventory (for the test script --debug output) ─────────────
export interface LdBlock {
  index: number
  type: string | string[] | null
  hasRecipe: boolean
}

export function inventoryBlocks(html: string): LdBlock[] {
  const $ = cheerio.load(html)
  const blocks: LdBlock[] = []
  $('script[type="application/ld+json"]').each((i, el) => {
    const text = $(el).html() ?? ''
    if (!text.trim()) return
    let parsed: unknown
    try { parsed = JSON.parse(text) } catch { return }
    const recipe = findRecipe(parsed)
    // Determine top-level @type for display
    let topType: string | string[] | null = null
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      topType = ((parsed as Record<string, unknown>)['@type'] as string | string[]) ?? null
    }
    blocks.push({ index: i, type: topType, hasRecipe: recipe !== null })
  })
  return blocks
}

// ─── Main extraction entry point ──────────────────────────────────────────────
export async function extractFromHtml(
  html: string,
  sourceUrl: string,
): Promise<RecipeData | null> {
  const $ = cheerio.load(html)
  const blocks = $('script[type="application/ld+json"]')

  for (let i = 0; i < blocks.length; i++) {
    const text = $(blocks[i]).html() ?? ''
    if (!text.trim()) continue

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      continue
    }

    const recipe = findRecipe(parsed)
    if (!recipe) continue

    const rawIngredients = recipe.recipeIngredient
    const ingredients = Array.isArray(rawIngredients)
      ? rawIngredients.map((s: unknown) => cleanIngredient(stripHtml(String(s)))).filter(Boolean)
      : []

    const steps = normaliseInstructions(recipe.recipeInstructions)

    // Skip blocks that have @type:Recipe but no usable content
    if (ingredients.length === 0 && steps.length === 0) continue

    const { author, authorUrl } = normaliseAuthor(recipe.author)

    let totalMinutes = parseISO8601(recipe.totalTime)
    if (!totalMinutes) {
      const prep = parseISO8601(recipe.prepTime)
      const cook = parseISO8601(recipe.cookTime)
      if (prep || cook) totalMinutes = (prep ?? 0) + (cook ?? 0)
      if (totalMinutes === 0) totalMinutes = null
    }

    return {
      title: typeof recipe.name === 'string' && recipe.name.trim()
        ? stripHtml(recipe.name)
        : 'Untitled Recipe',
      author,
      authorUrl,
      sourceUrl,
      ingredients,
      steps,
      totalMinutes,
      servings: normaliseYield(recipe.recipeYield),
    }
  }

  return null
}
