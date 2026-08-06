import type { ReactNode } from 'react'
import { FadeContent } from './reactbits/FadeContent'

type MotionRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

// Shared scroll reveal keeps section entrances consistent and accessible.
export function MotionReveal({ children, className = '', delay = 0 }: MotionRevealProps) {
  return (
    <FadeContent
      className={className}
      blur
      duration={0.72}
      delay={delay}
      threshold={0.18}
    >
      {children}
    </FadeContent>
  )
}
