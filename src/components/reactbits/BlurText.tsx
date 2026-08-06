import { motion, useReducedMotion, type Transition } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

type BlurTextProps = {
  text: string
  className?: string
  delay?: number
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  threshold?: number
  stepDuration?: number
}

// Adapted from React Bits Blur Text and kept on the project's existing motion package.
export function BlurText({
  text,
  className = '',
  delay = 90,
  animateBy = 'words',
  direction = 'bottom',
  threshold = 0.2,
  stepDuration = 0.35,
}: BlurTextProps) {
  const segments = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()
  const initial = useMemo(
    () => ({
      filter: 'blur(8px)',
      opacity: 0,
      y: direction === 'top' ? -18 : 18,
    }),
    [direction],
  )

  useEffect(() => {
    const element = ref.current
    if (!element || reduceMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [reduceMotion, threshold])

  if (reduceMotion) return <span className={className}>{text}</span>

  return (
    <span ref={ref} className={`flex flex-wrap ${className}`}>
      {segments.map((segment, index) => {
        const transition: Transition = {
          duration: stepDuration,
          delay: (index * delay) / 1000,
          ease: [0.22, 1, 0.36, 1],
        }

        return (
          <motion.span
            key={`${segment}-${index}`}
            initial={initial}
            animate={inView ? { filter: 'blur(0px)', opacity: 1, y: 0 } : initial}
            transition={transition}
            className="inline-block will-change-[transform,filter,opacity]"
          >
            {segment}
            {animateBy === 'words' && index < segments.length - 1 ? '\u00a0' : ''}
          </motion.span>
        )
      })}
    </span>
  )
}
