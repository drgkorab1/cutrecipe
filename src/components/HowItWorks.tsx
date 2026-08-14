// How it works — §4.4 — white card tiles with dark numbered circles
const STEPS = [
  {
    n: 1,
    title: 'Paste any link',
    description: 'Copy the address of the recipe page and drop it in the box above.',
  },
  {
    n: 2,
    title: 'We strip the noise',
    description:
      'Ads, autoplay videos, cookie banners and the story about grandma — all gone.',
  },
  {
    n: 3,
    title: 'Cook from a clean page',
    description:
      'Big text, tickable ingredients, screen stays on. Credit and a link to the author stay at the top.',
  },
]

export default function HowItWorks() {
  return (
    <section className="border-t border-line" style={{ padding: '76px 0' }}>
      <div className="mx-auto max-w-page px-7">
        <h2
          className="text-center font-serif font-semibold text-ink"
          style={{ fontSize: 34, marginBottom: 12 }}
        >
          How it works
        </h2>
        <p
          className="mx-auto mb-[46px] text-center text-muted"
          style={{ fontSize: 17, maxWidth: '56ch' }}
        >
          Three steps, no account, nothing to install.
        </p>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="border border-line bg-card"
              style={{ borderRadius: 16, padding: 28 }}
            >
              {/* Dark numbered circle */}
              <div
                className="mb-4 flex items-center justify-center rounded-full bg-ink text-[14px] font-bold text-white"
                style={{ width: 32, height: 32 }}
              >
                {step.n}
              </div>
              <h3
                className="font-serif font-semibold text-ink"
                style={{ fontSize: 19, marginBottom: 8 }}
              >
                {step.title}
              </h3>
              <p className="text-muted" style={{ fontSize: 15 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
