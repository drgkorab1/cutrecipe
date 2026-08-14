// Shared server-side fetch utility — imported by both the API route and
// the CLI test script (scripts/test-extract.ts).

import { isPrivateHost } from './ssrf'

export class SSRFError extends Error {
  constructor(url: string) {
    super(`Redirect to private/blocked address: ${url}`)
    this.name = 'SSRFError'
  }
}

// Tracking params stripped from every URL before use as cache key (§3.3)
export const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid',
]

export const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

/**
 * Fetch a URL safely:
 *  - Validates every redirect target against the private-IP blocklist (SSRF)
 *  - Follows up to 3 redirects manually
 *  - Respects the caller-supplied AbortSignal (use for timeouts)
 */
export async function safeFetch(startUrl: string, signal: AbortSignal): Promise<Response> {
  let url = startUrl
  let redirectsLeft = 3

  while (true) {
    const parsed = new URL(url)
    if (isPrivateHost(parsed.hostname)) throw new SSRFError(url)

    const res = await fetch(url, {
      redirect: 'manual',
      headers: FETCH_HEADERS,
      signal,
    })

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      if (redirectsLeft-- <= 0) throw new Error('Too many redirects.')
      const location = res.headers.get('location')
      if (!location) throw new Error('Redirect response missing Location header.')
      // Resolve relative Location values against current URL
      url = new URL(location, url).toString()
      continue
    }

    return res
  }
}
