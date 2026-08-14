// SSRF protection — §3.2
// Reject requests targeting private/reserved IP ranges so the API
// cannot be used as a proxy to reach internal infrastructure.

const PRIVATE_PATTERNS = [
  /^127\./,                      // loopback (127.0.0.0/8)
  /^10\./,                       // RFC 1918 (10.0.0.0/8)
  /^192\.168\./,                 // RFC 1918 (192.168.0.0/16)
  /^172\.(1[6-9]|2\d|3[01])\./, // RFC 1918 (172.16–31.x)
  /^169\.254\./,                 // link-local / AWS metadata (169.254.x.x)
  /^100\.64\./,                  // shared address space (RFC 6598)
  /^0\./,                        // "this" network
  /^::1$/,                       // IPv6 loopback
  /^fc[0-9a-f]{2}:/i,            // IPv6 unique local fc::/7
  /^fd[0-9a-f]{2}:/i,            // IPv6 unique local fd::/8
  /^fe80:/i,                     // IPv6 link-local
]

const PRIVATE_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal', // GCP metadata
])

export function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '') // strip IPv6 brackets
  if (PRIVATE_HOSTNAMES.has(h)) return true
  return PRIVATE_PATTERNS.some((re) => re.test(h))
}

export type UrlValidation =
  | { valid: true; url: URL }
  | { valid: false; error: string }

export function validateUrl(raw: string): UrlValidation {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid URL (e.g. https://example.com/pasta-recipe).',
    }
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, error: 'Only http and https URLs are supported.' }
  }

  if (isPrivateHost(url.hostname)) {
    return { valid: false, error: 'That URL is not allowed.' }
  }

  return { valid: true, url }
}
