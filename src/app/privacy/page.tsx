import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Cut Recipe collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '68ch', margin: '0 auto', padding: '60px 28px 100px' }}>

        <h1
          className="font-serif font-semibold text-ink"
          style={{ fontSize: 40, marginBottom: 8 }}
        >
          Privacy Policy
        </h1>
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 52 }}>
          Last updated: August 2026
        </p>

        <Section title="What we collect">
          <p>
            We only collect data you actively give us:
          </p>
          <ul>
            <li><strong>Email address</strong> — if you subscribe to the newsletter or create an account. We use this to send the weekly recipe email and for account authentication.</li>
            <li><strong>Saved recipes</strong> — if you have an account and choose to save a recipe, we store the recipe title, ingredients, steps, and the original source URL.</li>
          </ul>
          <p>
            We do not collect your name, payment details, or any other personal information.
          </p>
        </Section>

        <Section title="What we do not collect">
          <p>
            Recipe URLs and text you paste into the extractor are processed in real time and immediately discarded. We do not log, store, or analyse the content of recipes you extract.
          </p>
          <p>
            We do not run advertising trackers, sell data, or share your information with third parties for marketing purposes.
          </p>
        </Section>

        <Section title="Third-party services">
          <p>We use a small number of third-party services to run the site:</p>
          <ul>
            <li><strong>Supabase</strong> — stores account data and saved recipes. Data is held in the EU. <a href="https://supabase.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a>.</li>
            <li><strong>Anthropic</strong> — recipe content is sent to Anthropic&apos;s API to extract and structure ingredients and steps. Anthropic does not use API inputs to train models. <a href="https://www.anthropic.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Anthropic Privacy Policy</a>.</li>
            <li><strong>Vercel</strong> — hosts the site and API. Standard request logs (IP address, timestamp) are retained briefly for security purposes. <a href="https://vercel.com/legal/privacy-policy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a>.</li>
          </ul>
        </Section>

        <Section title="Cookies">
          <p>
            We only use cookies that are strictly necessary for the site to function — specifically, the authentication cookie set by Supabase when you sign in. We do not use advertising or analytics cookies.
          </p>
        </Section>

        <Section title="Your rights">
          <p>You can at any time:</p>
          <ul>
            <li><strong>Unsubscribe</strong> from the newsletter using the link at the bottom of any email.</li>
            <li><strong>Delete your account</strong> from the Settings tab on your account page. This permanently removes your email and all saved recipes.</li>
            <li><strong>Request a copy</strong> of the data we hold about you by contacting us.</li>
          </ul>
          <p>
            If you are in the EU or UK, you have additional rights under GDPR, including the right to restrict or object to processing. Contact us to exercise any of these rights.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            We keep your email and account data for as long as your account is active. If you delete your account, all personal data is permanently removed within 30 days.
          </p>
          <p>
            Newsletter subscribers who unsubscribe are removed from the mailing list immediately.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            If you have questions about this policy or want to exercise your data rights,{' '}
            <a href="/contact" className="text-accent hover:underline">
              get in touch via our contact page
            </a>.
          </p>
        </Section>

      </main>
      <Footer />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 44 }}>
      <h2
        className="font-serif font-semibold text-ink"
        style={{ fontSize: 22, marginBottom: 14 }}
      >
        {title}
      </h2>
      <div
        className="text-muted prose-section"
        style={{ fontSize: 15.5, lineHeight: 1.75 }}
      >
        {children}
      </div>
      <style>{`
        .prose-section p { margin-bottom: 12px; }
        .prose-section ul { padding-left: 20px; margin-bottom: 12px; }
        .prose-section li { margin-bottom: 8px; }
      `}</style>
    </section>
  )
}
