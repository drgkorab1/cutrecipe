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
    default: 'Free Recipe Extractor — YouTube, TikTok & Instagram | Cut Recipe',
    template: '%s | Cut Recipe',
  },

  description:
    'Free online recipe extractor and parser. Paste any YouTube video, TikTok, ' +
    'Instagram reel or recipe site link — get just the ingredients and steps. ' +
    'No sign-up, no ads, no life stories.',

  keywords: [
    'recipe extractor',
    'recipe parser',
    'recipe extractor youtube',
    'recipe extractor tiktok',
    'recipe extractor instagram',
    'youtube recipe extractor',
    'tiktok recipe extractor',
    'instagram recipe extractor',
    'extract recipe from video',
    'recipe text extractor',
    'recipe from youtube video',
    'recipe from tiktok',
    'recipe from instagram reel',
    'get just the recipe',
    'recipe without story',
    'skip the story recipe',
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
    title: 'Free Recipe Extractor — YouTube, TikTok & Instagram | Cut Recipe',
    description:
      'Free recipe extractor and parser. Paste any YouTube, TikTok or Instagram link — ' +
      'get just the ingredients and steps. No sign-up, no ads.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Free Recipe Extractor — YouTube, TikTok & Instagram | Cut Recipe',
    description:
      'Free recipe extractor. Paste any YouTube, TikTok or Instagram link — get just the ingredients and steps.',
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

// SoftwareApplication schema — signals this is a free web tool to Google
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cut Recipe',
  url: BASE_URL,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  description:
    'Free online recipe extractor and parser. Extract recipes from YouTube videos, TikTok reels, Instagram posts, and 40,000+ recipe websites. Get just the ingredients and steps — no ads, no sign-up.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'Recipe extractor for YouTube videos',
    'Recipe extractor for TikTok videos and photo posts',
    'Recipe extractor for Instagram reels',
    'Recipe extraction from 40,000+ recipe websites',
    'AI-powered recipe parser',
  ],
}

// FAQPage schema — targets "how to extract recipe from X" featured snippets
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a recipe extractor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A recipe extractor is a tool that pulls just the ingredients and steps from any recipe source — removing ads, long blog posts, autoplay videos, and other noise. Cut Recipe is a free recipe extractor that works with YouTube, TikTok, Instagram, and over 40,000 recipe websites.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I extract a recipe from a YouTube video?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paste the YouTube video URL into Cut Recipe and click "Get the recipe". We read the video description and auto-generated transcript to extract the ingredients and steps automatically — no manual copy-pasting needed.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I extract a recipe from TikTok?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paste any TikTok video or photo link into Cut Recipe. We extract the recipe from the caption text, spoken captions, and on-screen text overlays automatically — works for both video posts and photo carousels.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I extract a recipe from Instagram?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paste any Instagram reel or post URL into Cut Recipe. We extract the full recipe from the post caption automatically — no Instagram account or login required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Cut Recipe free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Cut Recipe is completely free — no sign-up, no paywall, no premium tier. Paste any recipe link and get just the ingredients and steps in seconds.',
      },
    },
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
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
