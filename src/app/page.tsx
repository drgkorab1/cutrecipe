import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Free Recipe Extractor — YouTube, TikTok & Instagram | Cut Recipe',
  description:
    'Free online recipe extractor and parser. Paste any YouTube video, TikTok, ' +
    'Instagram reel or recipe site link — get just the ingredients and steps. ' +
    'No sign-up, no ads, no life stories.',
  alternates: { canonical: 'https://cutrecipe.com' },
  openGraph: {
    url: 'https://cutrecipe.com',
    title: 'Free Recipe Extractor — YouTube, TikTok & Instagram | Cut Recipe',
    description:
      'Free recipe extractor and parser. Paste any YouTube, TikTok or Instagram link — ' +
      'get just the ingredients and steps. No sign-up, no ads.',
  },
}
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import WhatIs from '@/components/WhatIs'
import OtherTools from '@/components/OtherTools'
import Blog from '@/components/Blog'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhatIs />
        <OtherTools />
        <Blog />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}
