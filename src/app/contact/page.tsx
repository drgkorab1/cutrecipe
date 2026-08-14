import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Cut Recipe team.',
  alternates: { canonical: 'https://cutrecipe.com/contact' },
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '52ch', margin: '0 auto', padding: '60px 28px 100px' }}>
        <h1
          className="font-serif font-semibold text-ink"
          style={{ fontSize: 40, marginBottom: 10 }}
        >
          Get in touch
        </h1>
        <p className="text-muted" style={{ fontSize: 16, marginBottom: 44, lineHeight: 1.6 }}>
          Got a question, a bug to report, or just want to say hi? Drop us a message and we&apos;ll get back to you.
        </p>
        <ContactForm />
      </main>
      <Footer />
    </>
  )
}
