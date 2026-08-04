import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

type MotionRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

// Shared scroll reveal keeps section entrances consistent and accessible.
export function MotionReveal({ children, className = '', delay = 0 }: MotionRevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28, filter: 'blur(6px)' }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
