import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText as GsapSplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, GsapSplitText, useGSAP)

type SplitTextProps = {
  text: string
  id?: string
  className?: string
  delay?: number
  duration?: number
  ease?: string
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars'
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  threshold?: number
  rootMargin?: string
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  textAlign?: CSSProperties['textAlign']
}

// Adapted from React Bits Split Text (TS + Tailwind) for Lumi's local component system.
export function SplitText({
  text,
  id,
  className = '',
  delay = 50,
  duration = 1,
  ease = 'power3.out',
  splitType = 'words',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '0px',
  tag = 'p',
  textAlign = 'left',
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true)
      return
    }

    void document.fonts.ready.then(() => setFontsLoaded(true))
  }, [])

  useGSAP(
    () => {
      const element = ref.current
      if (!element || !fontsLoaded || !text) return

      const startPercent = (1 - threshold) * 100
      const split = new GsapSplitText(element, {
        type: splitType,
        smartWrap: true,
        wordsClass: 'split-word',
        charsClass: 'split-char',
        linesClass: 'split-line',
      })
      const targets = splitType.includes('chars')
        ? split.chars
        : splitType.includes('lines')
          ? split.lines
          : split.words

      const animation = gsap.fromTo(targets, from, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        force3D: true,
        willChange: 'transform, opacity',
        scrollTrigger: {
          trigger: element,
          start: `top ${startPercent}%`,
          once: true,
          fastScrollEnd: true,
        },
      })

      return () => {
        animation.scrollTrigger?.kill()
        animation.kill()
        split.revert()
      }
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
      ],
      scope: ref,
    },
  )

  const Tag = tag as ElementType

  return (
    <Tag
      id={id}
      ref={ref}
      className={`split-parent block overflow-hidden whitespace-normal ${className}`}
      style={{ textAlign, overflowWrap: 'break-word' }}
    >
      {text}
    </Tag>
  )
}
