import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type FadeContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  blur?: boolean
  duration?: number
  delay?: number
  threshold?: number
  initialOpacity?: number
}

// Adapted from React Bits Fade Content with Lumi's reduced-motion fallback.
export function FadeContent({
  children,
  blur = false,
  duration = 0.72,
  delay = 0,
  threshold = 0.18,
  initialOpacity = 0,
  className = '',
  ...props
}: FadeContentProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element || reduceMotion) return

    gsap.set(element, {
      autoAlpha: initialOpacity,
      y: 28,
      filter: blur ? 'blur(6px)' : 'blur(0px)',
      willChange: 'opacity, filter, transform',
    })

    const animation = gsap.to(element, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration,
      delay,
      ease: 'power3.out',
      paused: true,
    })
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: `top ${(1 - threshold) * 100}%`,
      once: true,
      onEnter: () => animation.play(),
    })

    return () => {
      trigger.kill()
      animation.kill()
      gsap.set(element, { clearProps: 'opacity,visibility,transform,filter,willChange' })
    }
  }, [blur, delay, duration, initialOpacity, reduceMotion, threshold])

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
}
