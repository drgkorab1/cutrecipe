// Full 4-column footer — §4.8
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-line" style={{ padding: '52px 0 40px' }}>
      <div className="mx-auto max-w-page px-7">
        {/* Four columns */}
        <div
          className="grid gap-9 grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr]"
          style={{ marginBottom: 38 }}
        >
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 inline-block hover:opacity-80 transition-opacity" aria-label="Cut Recipe — home">
              <Image
                src="/navbar-logo.png"
                alt="Cut Recipe"
                width={140}
                height={48}
              />
            </Link>
            <p
              className="text-muted"
              style={{ fontSize: 14.5, maxWidth: '34ch', marginTop: 12 }}
            >
              Recipes without the noise. Free, forever, with credit to the people who wrote them.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h4
              className="font-bold uppercase tracking-[.09em] text-muted"
              style={{ fontSize: 12.5, marginBottom: 14 }}
            >
              Tools
            </h4>
            <FooterLink href="/">Recipe extractor</FooterLink>
            <FooterLink href="/#cook-from-photo">Cook from a photo</FooterLink>
          </div>

          {/* Site */}
          <div>
            <h4
              className="font-bold uppercase tracking-[.09em] text-muted"
              style={{ fontSize: 12.5, marginBottom: 14 }}
            >
              Site
            </h4>
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/account">Saved recipes</FooterLink>
            <FooterLink href="/account">Sign in</FooterLink>
          </div>

          {/* About */}
          <div>
            <h4
              className="font-bold uppercase tracking-[.09em] text-muted"
              style={{ fontSize: 12.5, marginBottom: 14 }}
            >
              About
            </h4>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between border-t border-line text-muted"
          style={{ paddingTop: 22, fontSize: 13.5 }}
        >
          <span>© {new Date().getFullYear()} Cut Recipe</span>
          <span>Made for people who just want to cook.</span>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="mb-[9px] block text-ink opacity-80 hover:opacity-100 transition-opacity"
      style={{ fontSize: 14.5 }}
    >
      {children}
    </a>
  )
}
