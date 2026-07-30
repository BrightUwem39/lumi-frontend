import { useState, type FormEvent } from 'react'
import {
  FiArrowRight,
  FiArrowUp,
  FiFacebook,
  FiInstagram,
} from 'react-icons/fi'
import { FaPinterestP } from 'react-icons/fa'

const quickLinks = [
  { label: 'New arrivals', href: '#new-in' },
  { label: 'Women', href: '#women' },
  { label: 'Men', href: '#men' },
  { label: 'Accessories', href: '#accessories' },
  { label: 'Journal', href: '#journal' },
]

const policies = [
  { label: 'Shipping & delivery', href: '#shipping' },
  { label: 'Returns & exchanges', href: '#returns' },
  { label: 'Privacy policy', href: '#privacy' },
  { label: 'Terms & conditions', href: '#terms' },
  { label: 'Accessibility', href: '#accessibility' },
]

const socialLinks = [
  { label: 'Instagram', href: '#instagram', icon: FiInstagram },
  { label: 'Facebook', href: '#facebook', icon: FiFacebook },
  { label: 'Pinterest', href: '#pinterest', icon: FaPinterestP },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Temporary frontend state; the backend will eventually store subscribers.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
    setEmail('')
  }

  return (
    <footer className="bg-ink px-4 pb-6 pt-14 text-canvas sm:px-7 sm:pb-8 sm:pt-16 lg:px-10 lg:pt-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 pb-12 sm:grid-cols-2 sm:gap-x-12 lg:grid-cols-[1.2fr_0.7fr_0.8fr_1.3fr] lg:gap-10 lg:pb-16">
          {/* Brand and contact information remain together for quick reference. */}
          <div>
            <a
              href="/"
              aria-label="Lumi home"
              className="font-display text-4xl tracking-[0.12em]"
            >
              LUMI
            </a>
            <p className="mt-5 max-w-xs text-sm leading-6 text-canvas/60">
              Clothes for real days, made with a little more thought.
            </p>

            <address className="mt-7 space-y-2 text-xs not-italic text-canvas/65">
              <p>18 Kingsway, Lagos, Nigeria</p>
              <a
                href="mailto:hello@lumi.com"
                className="block transition-colors hover:text-canvas"
              >
                hello@lumi.com
              </a>
              <a
                href="tel:+2348005864000"
                className="block transition-colors hover:text-canvas"
              >
                +234 800 LUMI 000
              </a>
            </address>
          </div>

          {/* Quick shopping destinations. */}
          <nav aria-label="Footer quick links">
            <h2 className="mb-5 text-[10px] uppercase tracking-[0.2em]">
              Shop
            </h2>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs text-canvas/60 transition-colors hover:text-canvas"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Customer-service and legal destinations. */}
          <nav aria-label="Footer policies">
            <h2 className="mb-5 text-[10px] uppercase tracking-[0.2em]">
              Help & policies
            </h2>
            <ul className="space-y-3">
              {policies.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs text-canvas/60 transition-colors hover:text-canvas"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Compact footer signup offers another conversion point at page end. */}
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em]">
              Join the list
            </h2>
            <p className="mt-4 max-w-sm text-xs leading-5 text-canvas/60">
              Early access, new releases, and notes from the studio.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 flex border-b border-canvas/45 focus-within:border-canvas"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setSubmitted(false)
                }}
                placeholder="Email address"
                className="min-h-12 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-canvas/35 focus-visible:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe to Lumi newsletter"
                className="grid size-12 shrink-0 place-items-center transition-opacity hover:opacity-60"
              >
                <FiArrowRight size={17} />
              </button>
            </form>
            <p aria-live="polite" className="min-h-7 pt-2 text-[10px] text-canvas/55">
              {submitted ? 'You’re in. We’ll be in touch.' : ''}
            </p>

            <div className="mt-4 flex gap-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full border border-canvas/20 transition-colors hover:border-canvas hover:bg-canvas hover:text-ink"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Final legal row closes the page without competing with main links. */}
        <div className="flex flex-col gap-3 border-t border-canvas/15 pt-5 text-[9px] uppercase tracking-[0.16em] text-canvas/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Lumi. All rights reserved.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex w-fit items-center gap-2 text-canvas/65 transition-colors hover:text-canvas"
          >
            Back to top
            <FiArrowUp
              size={13}
              className="transition-transform group-hover:-translate-y-1"
            />
          </button>
        </div>
      </div>
    </footer>
  )
}
