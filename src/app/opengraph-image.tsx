import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Cut Recipe — Skip the Story, Get Just the Recipe'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#FBF7F1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Brand mark */}
        <div
          style={{
            width: 88,
            height: 88,
            background: '#C0532A',
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 36,
          }}
        >
          <span style={{ color: 'white', fontSize: 52, fontWeight: 700, lineHeight: 1 }}>C</span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#1E1B18',
            letterSpacing: '-2px',
            marginBottom: 20,
            lineHeight: 1,
          }}
        >
          Cut Recipe
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            color: '#6E655C',
            maxWidth: 680,
            textAlign: 'center',
            lineHeight: 1.45,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 400,
          }}
        >
          Skip the story. Get just the ingredients and steps.
        </div>

        {/* Domain */}
        <div
          style={{
            marginTop: 48,
            fontSize: 18,
            color: '#C0532A',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          cutrecipe.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
