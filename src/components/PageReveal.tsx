import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

type PageRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  distance?: number
}

// Shared inner-page motion keeps headings and content panels feeling connected
// to the route transition while respecting reduced-motion preferences.
export function PageReveal({
  children,
  className = '',
  delay = 0,
  distance = 18,
}: PageRevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: distance }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
