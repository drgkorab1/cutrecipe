import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Cut Recipe — Skip the Story, Get Just the Recipe',
  description:
    'Paste any recipe link and get just the ingredients and steps in seconds. ' +
    'Works with YouTube, TikTok, and any recipe website. No life stories, no ads.',
  alternates: { canonical: 'https://cutrecipe.com' },
  openGraph: {
    url: 'https://cutrecipe.com',
    title: 'Cut Recipe — Skip the Story, Get Just the Recipe',
    description: 'Paste any recipe link. Get just the ingredients and steps.',
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
