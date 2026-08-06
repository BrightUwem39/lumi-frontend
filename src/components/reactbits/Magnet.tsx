import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

type MagnetProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  padding?: number
  disabled?: boolean
  magnetStrength?: number
  wrapperClassName?: string
  innerClassName?: string
}

// Adapted from React Bits Magnet; the transform never changes document layout.
export function Magnet({
  children,
  padding = 48,
  disabled = false,
  magnetStrength = 5,
  wrapperClassName = '',
  innerClassName = '',
  ...props
}: MagnetProps) {
  const [active, setActive] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const magnetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 })
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      const element = magnetRef.current
      if (!element) return

      const { left, top, width, height } = element.getBoundingClientRect()
      const centerX = left + width / 2
      const centerY = top + height / 2
      const insideRange =
        Math.abs(centerX - event.clientX) < width / 2 + padding &&
        Math.abs(centerY - event.clientY) < height / 2 + padding

      setActive(insideRange)
      setPosition(
        insideRange
          ? {
              x: (event.clientX - centerX) / magnetStrength,
              y: (event.clientY - centerY) / magnetStrength,
            }
          : { x: 0, y: 0 },
      )
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [disabled, magnetStrength, padding])

  return (
    <div ref={magnetRef} className={wrapperClassName} {...props}>
      <div
        className={innerClassName}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: active
            ? 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
