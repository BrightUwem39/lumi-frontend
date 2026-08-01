import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowRight, FiCheck } from 'react-icons/fi'

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
      className="border-b border-line bg-canvas px-4 py-12 text-ink min-[380px]:py-14 sm:px-7 sm:py-20 lg:px-10 lg:py-24"
    >
      <motion.div
        className="mx-auto grid max-w-[1440px] gap-7 sm:gap-9 lg:grid-cols-[1fr_1.15fr] lg:items-end lg:gap-16"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55 }}
      >
        <div className="max-w-xl">
          <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/50">
            From our studio
          </p>
          <h2
            id="newsletter-heading"
            className="text-3xl leading-[1.08] min-[380px]:text-4xl sm:text-5xl"
          >
            We’ll only write when it’s worth opening.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-ink/60">
            First looks, early access, and the occasional note from behind the
            scenes. No daily emails.
          </p>
        </div>

        <div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2.5 border-b border-ink transition-colors focus-within:border-transparent sm:flex-row sm:items-center sm:gap-4"
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
              placeholder="Your email address"
              className="min-h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35 focus-visible:outline-none"
            />
            <button
              type="submit"
              className="group flex min-h-12 items-center justify-between gap-4 bg-ink px-5 text-[9px] font-medium uppercase tracking-[0.18em] text-canvas sm:min-w-40 sm:justify-center"
            >
              Join the list
              <FiArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </form>

          <div aria-live="polite" className="min-h-8 pt-3">
            <AnimatePresence>
              {subscribed && (
                <motion.p
                  className="flex items-center gap-2 text-xs text-ink/65"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <FiCheck size={14} />
                  You’re in. Keep an eye on your inbox.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
