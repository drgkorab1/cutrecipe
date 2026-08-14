#!/usr/bin/env npx tsx
/**
 * RecipeOnly — extraction test script
 *
 * Usage:
 *   npx tsx scripts/test-extract.ts <url>           # extract + print JSON
 *   npx tsx scripts/test-extract.ts --debug <url>   # also dump raw JSON-LD blocks
 *
 * Stdout:  the extracted recipe as pretty-printed JSON (pipe-friendly)
 * Stderr:  human-readable diagnostics
 *
 * Exit codes:
 *   0  success
 *   1  extraction failed or bad args
 *   2  URL rejected (SSRF / invalid)
 */

import { validateUrl } from '../src/lib/ssrf'
import { safeFetch, SSRFError, TRACKING_PARAMS, FETCH_HEADERS } from '../src/lib/fetch'
import { extractFromHtml, inventoryBlocks } from '../src/lib/extractor'
import { isYouTubeUrl, extractFromYouTube } from '../src/lib/youtube'

// ─── ANSI helpers ─────────────────────────────────────────────────────────────
const isTTY = process.stderr.isTTY
const c = {
  bold:  (s: string) => isTTY ? `\x1b[1m${s}\x1b[0m`  : s,
  dim:   (s: string) => isTTY ? `\x1b[2m${s}\x1b[0m`  : s,
  green: (s: string) => isTTY ? `\x1b[32m${s}\x1b[0m` : s,
  red:   (s: string) => isTTY ? `\x1b[31m${s}\x1b[0m` : s,
  yellow:(s: string) => isTTY ? `\x1b[33m${s}\x1b[0m` : s,
  cyan:  (s: string) => isTTY ? `\x1b[36m${s}\x1b[0m` : s,
}
const log  = (...a: unknown[]) => process.stderr.write(a.join(' ') + '\n')
const hr   = () => log(c.dim('─'.repeat(60)))

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args   = process.argv.slice(2)
  const debug  = args.includes('--debug')
  const rawUrl = args.find((a) => !a.startsWith('--'))

  if (!rawUrl) {
    log(c.bold('Usage:'))
    log('  npx tsx scripts/test-extract.ts [--debug] <url>')
    log('')
    log(c.bold('Examples:'))
    log('  npx tsx scripts/test-extract.ts https://www.allrecipes.com/recipe/20953/banana-banana-bread/')
    log('  npx tsx scripts/test-extract.ts --debug https://www.seriouseats.com/...')
    process.exit(1)
  }

  hr()
  log(c.bold('  RecipeOnly — Extraction Test'))
  hr()
  log(`  URL: ${c.cyan(rawUrl)}`)
  log('')

  // ── Validate ──────────────────────────────────────────────────────────────
  const validation = validateUrl(rawUrl)
  if (!validation.valid) {
    log(c.red(`✗ Rejected: ${validation.error}`))
    process.exit(2)
  }

  // ── Normalise URL (strip tracking params) ─────────────────────────────────
  const clean = new URL(rawUrl)
  TRACKING_PARAMS.forEach((p) => clean.searchParams.delete(p))
  const normUrl = clean.toString()
  if (normUrl !== rawUrl) log(c.dim(`  normalised → ${normUrl}`))

  // ── Fetch ─────────────────────────────────────────────────────────────────
  process.stderr.write('  [fetch] ')
  const t0 = Date.now()
  let html: string

  try {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 8_000)

    const res = await safeFetch(normUrl, controller.signal)
    clearTimeout(tid)
    const elapsed = Date.now() - t0

    const ct = res.headers.get('content-type') ?? '(none)'
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      log(c.red(`✗ Not HTML — Content-Type: ${ct}`))
      process.exit(1)
    }

    html = await res.text()
    const kb = (html.length / 1024).toFixed(0)
    log(c.green(`✓ ${elapsed}ms · ${kb} KB · status ${res.status}`))
    log(c.dim(`         Content-Type: ${ct}`))

    if (isYouTubeUrl(normUrl)) {
      log(c.cyan('  [youtube] YouTube URL detected — will use AI extraction'))
    }
  } catch (err) {
    if (err instanceof SSRFError) {
      log(c.red(`✗ SSRF blocked — ${(err as Error).message}`))
      process.exit(2)
    }
    if (err instanceof Error && err.name === 'AbortError') {
      log(c.red('✗ Timed out after 8 s'))
    } else {
      log(c.red(`✗ Fetch error — ${(err as Error).message}`))
    }
    process.exit(1)
  }

  // ── JSON-LD inventory ─────────────────────────────────────────────────────
  const blocks = inventoryBlocks(html)
  log(`  [ld+json] ${blocks.length} block(s) found`)

  for (const b of blocks) {
    const typeStr = Array.isArray(b.type)
      ? b.type.join(', ')
      : (b.type ?? '(no @type)')
    const marker = b.hasRecipe
      ? c.green('← Recipe')
      : c.dim('skip')
    log(`    block ${b.index}: ${typeStr}  ${marker}`)
  }

  if (debug) {
    log('')
    log(c.bold('  [--debug] Raw JSON-LD blocks:'))
    // Re-parse from HTML to dump raw content
    const { load } = await import('cheerio')
    const $ = load(html)
    $('script[type="application/ld+json"]').each((i, el) => {
      const text = $(el).html() ?? ''
      log('')
      log(c.dim(`  ── Block ${i} ──────────────────────────────`))
      try {
        log(JSON.stringify(JSON.parse(text), null, 2)
          .split('\n').slice(0, 60).map(l => '  ' + l).join('\n'))
        const lines = JSON.parse(text) ? JSON.stringify(JSON.parse(text), null, 2).split('\n').length : 0
        if (lines > 60) log(c.dim(`  … (${lines - 60} more lines)`))
      } catch {
        log(c.yellow('  [invalid JSON — could not parse]'))
        log(c.dim(text.slice(0, 400)))
      }
    })
  }

  // ── Extract ───────────────────────────────────────────────────────────────
  log('')
  const t1 = Date.now()

  let recipe
  if (isYouTubeUrl(normUrl)) {
    try {
      recipe = await extractFromYouTube(html, normUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log(c.red(`✗ YouTube extraction error — ${msg}`))
      if (msg.includes('ANTHROPIC_API_KEY')) {
        log('   → Add ANTHROPIC_API_KEY=sk-ant-... to .env.local')
      }
      process.exit(1)
    }
  } else {
    recipe = await extractFromHtml(html, normUrl)
  }

  const parseMs = Date.now() - t1

  if (!recipe) {
    log(c.red(`✗ No recipe extracted (${parseMs}ms)`))
    log('')
    log('  Possible reasons:')
    if (isYouTubeUrl(normUrl)) {
      log('   • Video description is too short or contains no recipe')
      log('   • YouTube served a consent / sign-in page instead of the watch page')
      log('   • AI model found no recipe in the description')
    } else {
      log('   • Site uses Microdata or plugin HTML instead of JSON-LD')
      log('     (needs Phase 2 fallbacks)')
      log('   • Recipe JSON-LD block is empty / has no ingredients or steps')
      log('   • Page is behind a login or paywall')
      log('   • URL points to a listing page, not a recipe page')
    }
    process.exit(1)
  }

  log(c.green(`✓ Extracted in ${parseMs}ms`))
  log('')
  hr()
  log(c.bold('  Result'))
  hr()
  log(`  Title       : ${c.bold(recipe.title)}`)
  log(`  Author      : ${recipe.author ?? c.dim('(none)')}`)
  log(`  Servings    : ${recipe.servings ?? c.dim('(none)')}`)
  log(`  Total time  : ${recipe.totalMinutes != null ? recipe.totalMinutes + ' min' : c.dim('(none)')}`)
  log(`  Ingredients : ${recipe.ingredients.length}`)
  log(`  Steps       : ${recipe.steps.length}`)

  if (recipe.ingredients.length > 0) {
    log('')
    log(c.bold('  First 3 ingredients:'))
    recipe.ingredients.slice(0, 3).forEach((ing, i) =>
      log(`    ${i + 1}. ${ing}`),
    )
    if (recipe.ingredients.length > 3)
      log(c.dim(`    … and ${recipe.ingredients.length - 3} more`))
  }

  if (recipe.steps.length > 0) {
    log('')
    log(c.bold('  First 2 steps:'))
    recipe.steps.slice(0, 2).forEach((step, i) =>
      log(`    ${i + 1}. ${step.length > 120 ? step.slice(0, 120) + '…' : step}`),
    )
    if (recipe.steps.length > 2)
      log(c.dim(`    … and ${recipe.steps.length - 2} more`))
  }

  hr()

  // ── JSON output to stdout ─────────────────────────────────────────────────
  process.stdout.write(JSON.stringify(recipe, null, 2) + '\n')
}

main().catch((err: unknown) => {
  process.stderr.write('\n💥 Unexpected error: ' + (err instanceof Error ? err.message : String(err)) + '\n')
  process.exit(1)
})
