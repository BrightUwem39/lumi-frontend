import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LuArrowRight as FiArrowRight, LuCheck as FiCheck } from 'react-icons/lu'
import { BlurText } from './reactbits/BlurText'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  // This frontend submission state will be replaced by the newsletter API later.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return
    // Persistence makes the frontend-only signup remain meaningful after refresh.
    localStorage.setItem('lumi-newsletter-email', normalizedEmail)
    setSubscribed(true)
    setEmail('')
  }

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="overflow-hidden bg-canvas px-4 py-9 text-ink sm:px-7 sm:py-12 lg:px-10 lg:py-14"
    >
      <motion.div
        className="mx-auto grid grid-cols-[minmax(0,1fr)] gap-7 border-b border-ink/18 pb-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-end lg:gap-12 lg:pb-10"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55 }}
      >
        <div className="min-w-0">
          <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/45">
            Notes from the studio
          </p>
          <h2
            id="newsletter-heading"
            className="mt-4 max-w-[12ch] text-[clamp(2.15rem,7vw,4.75rem)] leading-[0.94] tracking-[-0.03em]"
          >
            <BlurText
              text="See what’s next before it arrives."
              delay={75}
              direction="bottom"
            />
          </h2>
          <p className="mt-5 max-w-lg text-[13px] leading-6 text-ink/58 sm:text-sm">
            New work, restocks, and the occasional note from behind the scenes.
          </p>
        </div>

        <div className="min-w-0">
          <form
            onSubmit={handleSubmit}
            className="flex min-w-0 items-center border-b border-ink/45 transition-colors focus-within:border-ink"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setSubscribed(false)
              }}
              placeholder="Email address"
              className="min-h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35 focus-visible:outline-none"
            />
            <button
              type="submit"
              aria-label="Subscribe to Lumi newsletter"
              className="grid size-12 shrink-0 place-items-center transition-transform hover:translate-x-1"
            >
              <FiArrowRight size={19} />
            </button>
          </form>

          <div aria-live="polite" className="min-h-8 pt-2">
            <AnimatePresence>
              {subscribed && (
                <motion.p
                  className="flex items-center gap-2 text-[10px] text-ink/55"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <FiCheck size={14} />
                  You’re in. We’ll be in touch.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
