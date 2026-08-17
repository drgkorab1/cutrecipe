import { Camera, Brain, ChefHat } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// What's on the horizon — §4.5
const STEPS: { n: number; icon: LucideIcon; title: string; description: string }[] = [
  {
    n: 1,
    icon: Camera,
    title: 'Snap your fridge',
    description: 'Take a photo of whatever you have — no tidying required.',
  },
  {
    n: 2,
    icon: Brain,
    title: 'We read the ingredients',
    description: 'We identify what you have and figure out what you can make tonight.',
  },
  {
    n: 3,
    icon: ChefHat,
    title: 'Get recipes for tonight',
    description: 'Real recipes matched to your ingredients, ready in seconds.',
  },
]

export default function OtherTools() {
  return (
    <section id="cook-from-photo" className="border-t border-line" style={{ padding: '96px 0' }}>
      <div className="mx-auto max-w-page px-7">
        <div className="flex flex-col gap-14 sm:flex-row sm:items-center sm:gap-20">

          {/* Left — headline + CTA */}
          <div className="flex-1">
            <p className="mb-5 text-[13px] font-semibold uppercase tracking-[.08em] text-muted">
              What&apos;s on the horizon
            </p>
            <h2
              className="font-serif font-semibold text-ink"
              style={{ fontSize: 'clamp(28px, 8vw, 46px)', lineHeight: 1.08, marginBottom: 14 }}
            >
              Cook from<br />a photo
            </h2>
            <div className="mb-5 inline-flex items-center gap-2 rounded-pill bg-accent-soft px-[15px] py-[7px] text-[13px] font-semibold text-accent">
              <span className="inline-block h-[7px] w-[7px] rounded-full bg-accent" />
              Coming soon
            </div>
            <p className="text-muted" style={{ fontSize: 17, lineHeight: 1.7, maxWidth: '36ch', marginBottom: 36 }}>
              Snap your fridge or pantry. We figure out what you can make tonight — no typing, no searching, no waste.
            </p>
            <div>
              <a
                href="#newsletter"
                className="inline-block rounded-btn font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#C0532A', color: '#fff', padding: '13px 26px', fontSize: 15 }}
              >
                Get notified when it&apos;s ready →
              </a>
            </div>
          </div>

          {/* Right — vertical step flow */}
          <div className="flex-1" style={{ maxWidth: 400 }}>
            {STEPS.map((step, i) => (
              <div key={step.n} className="flex gap-5">
                {/* Circle + connecting line */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white"
                    style={{ width: 36, height: 36 }}
                  >
                    {step.n}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="mt-2 w-px flex-1"
                      style={{ background: 'var(--line)', minHeight: 36 }}
                    />
                  )}
                </div>
                {/* Text */}
                <div style={{ paddingBottom: i < STEPS.length - 1 ? 32 : 0, paddingTop: 4 }}>
                  <p
                    className="flex items-center gap-2 font-serif font-semibold text-ink"
                    style={{ fontSize: 19, marginBottom: 6 }}
                  >
                    <step.icon size={26} strokeWidth={1.5} className="text-accent/60 shrink-0" />
                    {step.title}
                  </p>
                  <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.65 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
