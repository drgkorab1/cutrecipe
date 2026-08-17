import type { Metadata, Viewport } from 'next'
import { Fraunces } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
})

const BASE_URL = 'https://cutrecipe.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  icons: {
    icon: '/favicon.png',
  },

  title: {
    default: 'Cut Recipe — Skip the Story, Get Just the Recipe',
    template: '%s | Cut Recipe',
  },

  description:
    'Paste any recipe link and get just the ingredients and steps in seconds. ' +
    'Works with YouTube, TikTok, and any recipe website. ' +
    'No life stories, no pop-ups, no scrolling past twelve photos of a kitchen.',

  keywords: [
    'recipe extractor',
    'get just the recipe',
    'recipe without story',
    'skip the story recipe',
    'YouTube recipe extractor',
    'TikTok recipe extractor',
    'paste recipe link',
    'recipe ingredients steps',
    'clean recipe',
  ],

  authors: [{ name: 'Cut Recipe', url: BASE_URL }],
  creator: 'Cut Recipe',
  publisher: 'Cut Recipe',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Cut Recipe',
    title: 'Cut Recipe — Skip the Story, Get Just the Recipe',
    description:
      'Paste any recipe link and get just the ingredients and steps. ' +
      'Works with YouTube, TikTok, and any recipe site.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Cut Recipe — Skip the Story, Get Just the Recipe',
    description: 'Paste any recipe link and get just the ingredients and steps.',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

}

export const viewport: Viewport = {
  themeColor: '#FBF7F1',
  width: 'device-width',
  initialScale: 1,
}

// WebSite schema — helps Google understand the site's identity and purpose
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Cut Recipe',
  alternateName: 'Skip The Story',
  url: BASE_URL,
  description:
    'Paste any recipe link and get just the ingredients and steps — no stories, no ads.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/?r={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

// Organization schema — establishes brand entity for Google's knowledge graph
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cut Recipe',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.svg`,
  sameAs: [],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={fraunces.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VDLP4D6HYP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VDLP4D6HYP');
          `}
        </Script>
      </body>
    </html>
  )
}
