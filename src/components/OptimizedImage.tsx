import type { ImgHTMLAttributes } from 'react'

type OptimizedImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> & {
  src: string
  responsiveWidths?: number[]
  eager?: boolean
}

// Shared native image defaults keep local and API-hosted media lightweight.
export function OptimizedImage({
  src,
  responsiveWidths: _responsiveWidths,
  eager = false,
  loading,
  ...imageProps
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      loading={eager ? 'eager' : loading}
      {...imageProps}
    />
  )
}
