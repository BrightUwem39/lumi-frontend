import {
  LuArrowUp as FiArrowUp,
  LuArrowUpRight as FiArrowUpRight,
  LuChevronDown as FiChevronDown,
  LuFacebook as FiFacebook,
  LuInstagram as FiInstagram,
  LuMail as FiMail,
  LuMapPin as FiMapPin,
  LuPhone as FiPhone,
} from 'react-icons/lu'
import { FaPinterestP } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const quickLinks = [
  { label: 'New arrivals', to: '/shop?sort=latest' },
  { label: 'Women', to: '/shop?category=Women' },
  { label: 'Men', to: '/shop?category=Men' },
  { label: 'Accessories', to: '/shop?category=Accessories' },
  { label: 'Journal', to: '/journal' },
]

const policies = [
  { label: 'Shipping & delivery', to: '/policies/shipping-delivery' },
  { label: 'Returns & exchanges', to: '/policies/returns-exchanges' },
  { label: 'Privacy policy', to: '/policies/privacy' },
  { label: 'Terms & conditions', to: '/policies/terms' },
  { label: 'Accessibility', to: '/policies/accessibility' },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: FiInstagram },
  { label: 'Facebook', href: 'https://www.facebook.com/', icon: FiFacebook },
  { label: 'Pinterest', href: 'https://www.pinterest.com/', icon: FaPinterestP },
]

export function Footer() {
  return (
    <footer id="site-footer" className="overflow-hidden bg-ink px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-canvas sm:px-7 sm:pb-8 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        {/* The oversized wordmark gives the footer a recognizable fashion-house finish. */}
        <Link
          to="/"
          aria-label="Lumi home"
          className="block border-b border-canvas/18 py-9 font-display text-[clamp(4.5rem,20vw,14rem)] leading-[0.72] tracking-[-0.055em] sm:py-14"
        >
          LUMI
        </Link>

        <div className="border-b border-canvas/18 py-8 sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-11 sm:py-14 lg:grid-cols-[1.15fr_0.7fr_0.9fr_0.85fr] lg:gap-12">
          <div className="min-w-0 pb-8 sm:col-span-2 sm:pb-0 lg:col-span-1">
            <p className="max-w-xs text-sm leading-6 text-canvas/60">
              Clothes for real days, made with a little more thought.
            </p>
            <address className="mt-7 space-y-4 text-xs not-italic text-canvas/65">
              <p className="flex items-start gap-3"><FiMapPin size={14} className="mt-0.5 shrink-0" />18 Kingsway, Lagos, Nigeria</p>
              <a href="mailto:hello@lumi.com" className="flex items-center gap-3 transition-colors hover:text-canvas"><FiMail size={14} />hello@lumi.com</a>
              <a href="tel:+2348005864000" className="flex items-center gap-3 transition-colors hover:text-canvas"><FiPhone size={14} />+234 800 LUMI 000</a>
            </address>
          </div>

          <FooterNav title="Shop" label="Footer quick links" links={quickLinks} />
          <FooterNav title="Help & policies" label="Footer policies" links={policies} />

          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            {/* Social links collapse on phones and remain fully visible above them. */}
            <details className="group border-t border-canvas/18 sm:hidden">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[9px] uppercase tracking-[0.18em] text-canvas/70 [&::-webkit-details-marker]:hidden">
                Follow
                <FiChevronDown size={15} className="transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <SocialLinks className="pb-3" />
            </details>

            <div className="hidden sm:block">
              <h2 className="mb-4 text-[9px] uppercase tracking-[0.18em] text-canvas/45">Follow</h2>
              <SocialLinks />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-6 text-[8px] uppercase tracking-[0.14em] text-canvas/42 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <p>© {new Date().getFullYear()} Lumi</p>
            <p>Lagos · Nigeria</p>
          </div>
          <button
            id="footer-back-to-top"
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex min-h-10 w-fit items-center gap-3 border border-canvas/20 px-4 text-canvas/65 transition-colors hover:border-canvas hover:text-canvas"
          >
            Back to top
            <FiArrowUp size={13} className="transition-transform group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </footer>
  )
}

function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`divide-y divide-canvas/15 border-y border-canvas/15 ${className}`}>
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className="group flex min-h-11 items-center gap-3 text-xs text-canvas/65 transition-colors hover:text-canvas">
                  <Icon size={14} />
                  <span className="flex-1">{label}</span>
                  <FiArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ))}
    </div>
  )
}

function FooterNav({
  title,
  label,
  links,
}: {
  title: string
  label: string
  links: { label: string; to: string }[]
}) {
  return (
    <>
      {/* Native details keep mobile dropdowns keyboard-accessible without extra state. */}
      <details className="group border-t border-canvas/18 sm:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[9px] uppercase tracking-[0.18em] text-canvas/70 [&::-webkit-details-marker]:hidden">
          {title}
          <FiChevronDown size={15} className="transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <FooterLinkList links={links} className="pb-5" />
      </details>

      <nav aria-label={label} className="hidden min-w-0 sm:block">
        <h2 className="mb-4 text-[9px] uppercase tracking-[0.18em] text-canvas/45">{title}</h2>
        <FooterLinkList links={links} />
      </nav>
    </>
  )
}

function FooterLinkList({ links, className = '' }: { links: { label: string; to: string }[]; className?: string }) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {links.map((link) => (
        <li key={link.label}>
          <Link to={link.to} className="text-xs leading-5 text-canvas/62 transition-colors hover:text-canvas">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
