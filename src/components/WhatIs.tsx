// What is a Recipe Extractor — SEO keyword section
const BLURBS = [
  {
    heading: 'Free recipe extractor and parser',
    body: "Cut Recipe is a free online recipe extractor and parser. Paste any link and get just the ingredients and steps — no life story, no ads, no autoplay video. It also works as a recipe parser for raw text: paste a TikTok caption or any block of recipe text and we'll structure it instantly.",
  },
  {
    heading: 'Extract recipes from YouTube, TikTok, Instagram & more',
    body: 'Paste a YouTube video link and we extract the recipe from the description and transcript. Paste a TikTok or Instagram reel and we pull the recipe from the caption. Works with Allrecipes, BBC Good Food, Serious Eats, NYT Cooking, Bon Appétit, and 40,000+ other sites too.',
  },
  {
    heading: 'Skip the blog post. Get just the recipe.',
    body: "Most recipe sites bury the ingredients under hundreds of words of backstory. Cut Recipe skips straight to the good part — big readable text, tickable ingredient checkboxes, and a keep-screen-on mode so your phone doesn't go dark mid-cook.",
  },
  {
    heading: 'Free forever. No account needed.',
    body: "No signup, no paywall, no premium tier. Paste any recipe link and get the clean recipe in seconds. We always credit and link back to the original author.",
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
          What is a Recipe Extractor?
        </h2>
        <p
          className="mx-auto mb-[46px] text-center text-muted"
          style={{ fontSize: 17, maxWidth: '56ch' }}
        >
          Paste any recipe link — YouTube, TikTok, Instagram, or any site. Get just the ingredients and steps.
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
