import RecipeForm from './RecipeForm'

const SITES = ['Allrecipes', 'BBC Good Food', 'Serious Eats', 'NYT Cooking', 'Bon Appétit']

export default function Hero() {
  return (
    <div className="mx-auto max-w-page px-7 py-[78px] pb-[68px] text-center">
      {/* Pill */}
      <div className="mb-[26px] inline-flex items-center gap-2 rounded-pill bg-accent-soft px-[15px] py-[7px] text-[13px] font-semibold text-accent">
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-accent" />
        Free forever — no signup, no paywall
      </div>

      {/* H1 */}
      <h1
        className="mx-auto mb-[18px] font-serif font-semibold text-ink"
        style={{ fontSize: 56, lineHeight: 1.08, maxWidth: '15ch' }}
      >
        Paste the link. Get <em className="italic text-accent">just</em> the recipe.
      </h1>

      {/* Subheading */}
      <p
        className="mx-auto mb-[34px] text-muted"
        style={{ fontSize: 18, maxWidth: '52ch' }}
      >
        No life story, no pop-ups, no scrolling past twelve photos of a kitchen.
        Ingredients and steps, in two seconds.
      </p>

      {/* Search bar + result */}
      <RecipeForm />

      {/* Trust */}
      <p className="mt-5 text-sm text-muted">
        No account needed.{' '}
        <b className="font-semibold text-brand-green">Always free.</b>{' '}
        We link back to the original author.
      </p>

      {/* Social proof */}
      <p className="mt-11 text-[13px] uppercase tracking-[.06em] text-[#A99E92]">
        Works with 40,000+ recipe sites
      </p>
      <div className="mt-[14px] flex flex-wrap justify-center gap-[26px] font-serif text-[16px] text-[#BCAF9F]">
        {SITES.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  )
}
