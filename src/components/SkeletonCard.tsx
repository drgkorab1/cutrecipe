'use client'

import { useState, useEffect } from 'react'

const LOADING_MESSAGES = [
  "Sharpening the chef's knife…",
  "Asking grandma for permission to share her secret…",
  "Removing the life story before the recipe…",
  "Skimming past the 47-paragraph intro…",
  "Filing a restraining order against the auto-play video…",
  "Scrolling past the 12 ads…",
  "Translating 'a pinch' into something useful…",
  "Negotiating with the recipe paywall…",
  "Speed-reading through the author's trip to Italy…",
  "Locating the actual recipe buried on page 3…",
  "Defusing the pop-up newsletter bomb…",
  "Counting the times 'delicious' was used…",
  "Skipping the 'but first, let me tell you about my farm'…",
  "Extracting recipe from 4,000 words of prose…",
  "Muting the background music nobody asked for…",
  "Wrestling with the cookie consent banner…",
  "Decoding 'add until it looks right'…",
  "Bypassing the 'Jump to Recipe' button that doesn't work…",
  "Asking the author to please get to the point…",
  "Converting 'mom's old measuring cup' to real units…",
  "Restraining ourselves from reading the comments…",
  "Politely declining the email subscription…",
  "Archiving the backstory for a rainy day…",
  "Filtering out the sponsored content…",
  "Looking for the recipe between the ads…",
  "Explaining to the website why we're in a hurry…",
  "Untangling the ingredient list from the SEO keywords…",
  "Escaping the infinite scroll of related recipes…",
  "Removing the phrase 'trust me, you'll love this'…",
  "Summoning the recipe from beneath the life story…",
  "Translating 'season generously' to actual measurements…",
  "Checking if 'easy' really means easy…",
  "Rescuing the recipe from 6 pop-up ads…",
  "Surviving the auto-loading related posts…",
  "Fact-checking if this is actually 'the best ever'…",
  "Locating the recipe hidden in the FAQ section…",
  "Politely declining the cooking class upsell…",
  "Redacting the sponsored ingredient brands…",
  "Untangling the 'optional but not really' ingredients…",
  "Measuring out exactly how much patience this takes…",
  "Converting 'a handful' to something your hand can agree on…",
  "Finding the recipe before our hunger does…",
  "Stripping the affiliate links from the equipment list…",
  "Asking the food blogger to please wrap it up…",
  "Making the recipe load faster than your motivation fades…",
  "Clearing a path through the stock photos…",
  "Decoding 'serves 4' for someone eating alone…",
  "Hiding the author's childhood memory about soup…",
  "Removing 23 photos of the same dish from slightly different angles…",
  "Almost there… unlike the recipe, this won't take all day.",
]

export default function SkeletonCard() {
  const [msgIndex, setMsgIndex] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto" style={{ maxWidth: 820 }}>

      {/* Loading message card */}
      <div
        className="mb-5 bg-card"
        style={{
          borderRadius: 20,
          border: '1px solid var(--line)',
          boxShadow: '0 20px 50px -30px rgba(30,27,24,.4)',
          padding: '40px 40px',
        }}
      >
        <div className="flex items-center gap-5">
          <div className="spinner" />
          <p
            className="font-serif"
            style={{
              fontSize: 19,
              color: 'var(--ink)',
              lineHeight: 1.4,
              transition: 'opacity 0.4s ease',
              opacity: visible ? 1 : 0,
            }}
          >
            {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>
      </div>

      {/* Skeleton recipe card */}
      <div
        className="overflow-hidden bg-card"
        style={{
          borderRadius: 20,
          border: '1px solid var(--line)',
          boxShadow: '0 20px 50px -30px rgba(30,27,24,.4)',
        }}
        aria-label="Loading recipe…"
        aria-busy="true"
      >
        {/* Attribution strip */}
        <div
          className="flex items-center justify-between gap-4"
          style={{ padding: '16px 26px', background: '#FCF9F5', borderBottom: '1px solid var(--line)' }}
        >
          <div className="skeleton h-4 w-52 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>

        <div style={{ padding: '30px 34px 36px' }}>
          {/* Title */}
          <div className="skeleton mb-2 h-8 w-3/4 rounded" />
          <div className="skeleton mb-6 h-8 w-1/2 rounded" />

          {/* Meta */}
          <div className="mb-6 flex flex-wrap gap-6">
            {[80, 72, 90, 64].map((w, i) => (
              <div key={i} className="skeleton h-5 rounded" style={{ width: w }} />
            ))}
          </div>

          {/* Tool chips */}
          <div className="mb-7 flex flex-wrap gap-[10px] border-b border-line pb-[26px]">
            <div className="skeleton h-9 w-32 rounded-pill" />
            <div className="skeleton h-9 w-20 rounded-pill" />
            <div className="skeleton h-9 w-16 rounded-pill" />
            <div className="skeleton h-9 w-24 rounded-pill" />
          </div>

          {/* Columns */}
          <div className="grid gap-11 grid-cols-1 sm:grid-cols-[1fr_1.25fr]">
            <div>
              <div className="skeleton mb-4 h-4 w-24 rounded" />
              {['full', '4/5', '3/4', 'full', '2/3', '5/6', '3/4', '4/5'].map((w, i) => (
                <div key={i} className="border-b border-dashed border-[#EFE7DC] py-[9px]">
                  <div className={`skeleton h-[18px] w-${w} rounded`} />
                </div>
              ))}
            </div>
            <div>
              <div className="skeleton mb-4 h-4 w-16 rounded" />
              {[[100, 80, 60], [100, 88], [100, 75, 82], [100, 66]].map((lines, i) => (
                <div key={i} className="flex gap-[14px] py-[11px]">
                  <div className="skeleton shrink-0 rounded-full" style={{ width: 26, height: 26 }} />
                  <div className="flex-1 space-y-2">
                    {lines.map((pct, j) => (
                      <div
                        key={j}
                        className="skeleton h-4 rounded"
                        style={{ width: `${pct}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
