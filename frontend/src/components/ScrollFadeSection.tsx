import { useRef, type ReactNode } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'

type ScrollFadeSectionProps = {
  children: ReactNode
}

// Major homepage sections fade through the viewport instead of appearing as static blocks.
export function ScrollFadeSection({ children }: ScrollFadeSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // A spring removes harsh opacity jumps during fast trackpad or touch scrolling.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 95,
    damping: 28,
    mass: 0.35,
  })
  const opacity = useTransform(smoothProgress, [0, 0.16, 0.8, 1], [0, 1, 1, 0])
  const y = useTransform(smoothProgress, [0, 0.16, 0.8, 1], [34, 0, 0, -26])

  return (
    <motion.div
      ref={sectionRef}
      data-home-scroll-section
      style={reduceMotion ? undefined : { opacity, y, willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}
