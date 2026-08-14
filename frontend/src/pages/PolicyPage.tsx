import { LuArrowLeft as FiArrowLeft, LuMail as FiMail, LuPhone as FiPhone } from 'react-icons/lu'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageReveal } from '../components/PageReveal'
import { commerceTerms, formatMoney } from '../lib/currency'

const freeShippingThreshold = formatMoney(
  commerceTerms('NGN').freeShippingThreshold,
)

type Policy = {
  eyebrow: string
  title: string
  introduction: string
  sections: Array<{ heading: string; paragraphs: string[] }>
}

// Centralized content keeps the customer-care routes consistent and easy to edit.
const policies: Record<string, Policy> = {
  'shipping-delivery': {
    eyebrow: 'Customer care',
    title: 'Shipping & delivery',
    introduction: 'From our studio to your door, we keep delivery simple and provide updates at every useful step.',
    sections: [
      { heading: 'Processing your order', paragraphs: ['Orders are prepared within one to two business days. Once your parcel leaves us, you’ll receive an email with tracking information.'] },
      { heading: 'Delivery timing', paragraphs: ['Deliveries within Nigeria typically arrive in two to five business days. International deliveries generally take five to ten business days, depending on the destination and customs.'] },
      { heading: 'Shipping costs', paragraphs: [`Standard shipping is complimentary from ${freeShippingThreshold}. Available delivery options and final costs are shown before you place your order.`] },
      { heading: 'Need a hand?', paragraphs: ['If tracking has not updated or your parcel is delayed, contact us with your order number and we’ll look into it.'] },
    ],
  },
  'returns-exchanges': {
    eyebrow: 'Customer care',
    title: 'Returns & exchanges',
    introduction: 'We want every piece to earn its place in your wardrobe. If something is not right, here is how to send it back.',
    sections: [
      { heading: 'Return window', paragraphs: ['Eligible items may be returned within 14 days of delivery. They must be unworn, unwashed, and returned with their original tags and packaging.'] },
      { heading: 'Starting a return', paragraphs: ['Email our client-services team with your order number and the item you wish to return. We’ll reply with the next steps and the correct return address.'] },
      { heading: 'Refunds', paragraphs: ['Approved refunds are returned to the original payment method. Bank processing times may vary after the refund is issued.'] },
      { heading: 'Exceptions', paragraphs: ['Personalized pieces, gift cards, and items marked final sale cannot be returned unless they arrive faulty.'] },
    ],
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy policy',
    introduction: 'We use only the information needed to provide the store experience, communicate with you, and improve Lumi.',
    sections: [
      { heading: 'Information you provide', paragraphs: ['This can include your contact details, delivery information, account preferences, and messages sent to client services. Payment credentials are handled by Paystack’s hosted checkout and are not stored by Lumi.'] },
      { heading: 'How information is used', paragraphs: ['Information may be used to fulfil orders, respond to requests, prevent misuse, and send marketing only when you have chosen to receive it.'] },
      { heading: 'Your choices', paragraphs: ['You may request access, correction, or deletion of personal information and unsubscribe from marketing at any time.'] },
      { heading: 'Testing environment', paragraphs: ['Lumi currently uses Paystack test mode, so no real payment is taken. Account, cart, order, and payment state are managed by the application backend, while limited interface preferences may remain in your browser.'] },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms & conditions',
    introduction: 'These terms describe the basic rules for using the Lumi storefront and testing its shopping experience.',
    sections: [
      { heading: 'Using the site', paragraphs: ['You may use the site for lawful personal shopping. Do not interfere with its operation, attempt unauthorized access, or reuse protected content without permission.'] },
      { heading: 'Product information', paragraphs: ['We aim to present colors, materials, prices, and availability accurately. Displays vary, and information may be corrected when an error is identified.'] },
      { heading: 'Orders', paragraphs: ['An order is recorded only when it is confirmed by the Lumi backend. Paystack is currently configured in test mode, so checkout does not charge a real payment method.'] },
      { heading: 'Changes', paragraphs: ['Store features and these terms may evolve before launch. The version displayed here should be reviewed and replaced with approved legal terms before accepting real orders.'] },
    ],
  },
  accessibility: {
    eyebrow: 'Our commitment',
    title: 'Accessibility',
    introduction: 'Lumi should be comfortable to browse for as many people as possible, regardless of device or ability.',
    sections: [
      { heading: 'What we are doing', paragraphs: ['We use semantic structure, keyboard-accessible controls, readable contrast, responsive layouts, descriptive labels, and reduced visual clutter throughout the store.'] },
      { heading: 'Ongoing improvements', paragraphs: ['Accessibility is an ongoing practice. We test common journeys across screen sizes and will continue improving focus behavior, assistive-technology support, and content clarity.'] },
      { heading: 'Tell us what is not working', paragraphs: ['If you experience a barrier, email hello@lumi.com and describe the page, device, and issue. We’ll use that detail to investigate and respond.'] },
    ],
  },
}

export function PolicyPage() {
  const { policyId = '' } = useParams()
  const policy = policies[policyId]

  if (!policy) return <Navigate to="/" replace />

  return (
    <main className="w-full min-w-0 overflow-x-clip bg-canvas text-ink">
      <header className="w-full border-b border-line px-4 py-6 min-[480px]:py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10 xl:py-12">
        <PageReveal className="mx-auto w-full min-w-0 max-w-[1180px]">
          <Link to="/" className="inline-flex min-h-10 items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-ink/55 hover:text-ink">
            <FiArrowLeft size={14} /> Back to Lumi
          </Link>
          <p className="mt-5 text-[8px] uppercase tracking-[0.18em] text-ink/45 sm:mt-6 sm:text-[9px] sm:tracking-[0.2em]">{policy.eyebrow}</p>
          <h1 className="mt-3 w-full max-w-full break-words text-3xl leading-[1.02] min-[380px]:text-4xl sm:max-w-[15ch] md:text-5xl xl:text-6xl">{policy.title}</h1>
          <p className="mt-4 max-w-2xl break-words text-[13px] leading-6 text-ink/60 sm:mt-5 sm:text-sm md:text-base md:leading-7">{policy.introduction}</p>
          <p className="mt-4 text-[8px] uppercase tracking-[0.12em] text-ink/40 sm:mt-5 sm:text-[9px] sm:tracking-[0.14em]">Last reviewed · July 2026</p>
        </PageReveal>
      </header>

      {/* Phones, tablets, and laptops stay stacked; only wide desktops split. */}
      <div className="mx-auto grid w-full max-w-[1180px] min-w-0 grid-cols-1 gap-6 px-4 py-6 min-[480px]:py-8 sm:gap-8 sm:px-6 md:px-8 lg:px-10 lg:py-10 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-10 xl:py-12">
        <PageReveal>
          <article className="w-full min-w-0 divide-y divide-line border-y border-line">
            {policy.sections.map((section, index) => (
              <section key={section.heading} className="grid w-full min-w-0 grid-cols-1 gap-2 py-4 min-[480px]:py-5 sm:grid-cols-[32px_minmax(0,1fr)] sm:gap-4 sm:py-6 md:grid-cols-[40px_minmax(0,1fr)] md:gap-5">
                <span className="text-[9px] text-ink/35">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <h2 className="break-words text-lg leading-tight min-[380px]:text-xl md:text-2xl">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 max-w-3xl break-words text-[13px] leading-6 text-ink/60 sm:text-sm">{paragraph}</p>)}
                </div>
              </section>
            ))}
          </article>
        </PageReveal>

        <PageReveal delay={0.08} className="xl:sticky xl:top-32 xl:self-start">
          <aside className="grid w-full min-w-0 grid-cols-1 gap-5 border border-line p-4 min-[380px]:p-5 sm:grid-cols-2 sm:items-center sm:gap-8 sm:p-6 xl:block">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] text-ink/45">Still need help?</p>
              <h2 className="mt-2 text-2xl">Talk to our team</h2>
              <p className="mt-3 text-xs leading-5 text-ink/55">Client services are available Monday to Friday.</p>
            </div>
            <div className="min-w-0 xl:mt-6">
              <a href="mailto:hello@lumi.com" className="flex min-h-11 min-w-0 items-center gap-3 border-t border-line pt-3 text-xs"><FiMail className="shrink-0" /><span className="min-w-0 break-all">hello@lumi.com</span></a>
              <a href="tel:+2348005864000" className="flex min-h-11 min-w-0 items-center gap-3 border-t border-line pt-3 text-xs"><FiPhone className="shrink-0" /><span className="min-w-0 break-words">+234 800 LUMI 000</span></a>
            </div>
          </aside>
        </PageReveal>
      </div>
    </main>
  )
}
