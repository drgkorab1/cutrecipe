// What is Cut Recipe — SEO keyword section
const BLURBS = [
  {
    heading: 'Just the recipe. Nothing else.',
    body: 'Cut Recipe is a free recipe extractor. Paste any link and get just the recipe — ingredients and steps only, no life story, no ads, no autoplay video. Just the recipe, on one clean page.',
  },
  {
    heading: 'Works with YouTube, TikTok, and 40,000+ sites',
    body: 'Found a recipe on Allrecipes, BBC Good Food, Serious Eats, NYT Cooking, Bon Appétit, or a random TikTok? Paste the link and get just the recipe text, stripped of everything else.',
  },
  {
    heading: 'Skip the blog post. Get just the recipe.',
    body: "Most recipe sites bury the ingredients under hundreds of words of backstory. Cut Recipe skips straight to the good part — big readable text, tickable ingredient checkboxes, and a keep-screen-on mode so your phone doesn't go dark mid-cook.",
  },
  {
    heading: 'Free forever. No account needed.',
    body: "No signup, no paywall, no premium tier. Paste the link, get the clean recipe in seconds. We always credit and link back to the original author.",
  },
]

export default function WhatIs() {
  return (
    <section className="border-t border-line" style={{ padding: '76px 0' }}>
      <div className="mx-auto max-w-page px-7">
        <h2
          className="text-center font-serif font-semibold text-ink"
          style={{ fontSize: 34, marginBottom: 12 }}
        >
          What is Cut Recipe?
        </h2>
        <p
          className="mx-auto mb-[46px] text-center text-muted"
          style={{ fontSize: 17, maxWidth: '56ch' }}
        >
          Paste a recipe link. Get just the recipe. No story, no ads, no scrolling.
        </p>

        <div className="grid gap-x-10 gap-y-9 grid-cols-1 sm:grid-cols-2">
          {BLURBS.map((b) => (
            <div key={b.heading}>
              <h3
                className="font-serif font-semibold text-ink"
                style={{ fontSize: 18, marginBottom: 8 }}
              >
                {b.heading}
              </h3>
              <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.7 }}>
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
