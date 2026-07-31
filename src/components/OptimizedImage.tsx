import {
  useEffect,
  useMemo,
  useState,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from 'react'
import {
  AdvancedImage,
  lazyload,
  placeholder,
  responsive,
} from '@cloudinary/react'
import { cloudinary, getCloudinaryPublicId } from '../lib/cloudinary'

type OptimizedImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> & {
  src: string
  cloudinaryPublicId?: string
  responsiveWidths?: number[]
  eager?: boolean
}

// Cloudinary is used when configured; local assets remain a development fallback.
export function OptimizedImage({
  src,
  cloudinaryPublicId,
  responsiveWidths = [320, 480, 640, 960, 1280],
  eager = false,
  onError,
  ...imageProps
}: OptimizedImageProps) {
  const [cloudinaryFailed, setCloudinaryFailed] = useState(false)
  const publicId = cloudinaryPublicId ?? getCloudinaryPublicId(src)
  const cloudinaryImage = useMemo(() => {
    if (!cloudinary || !publicId) return null
    return cloudinary.image(publicId).format('auto').quality('auto')
  }, [publicId])

  useEffect(() => {
    setCloudinaryFailed(false)
  }, [publicId])

  const handleCloudinaryError = (
    event: SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    setCloudinaryFailed(true)
    onError?.(event)
  }

  if (!cloudinaryImage || cloudinaryFailed) {
    return (
      <img
        src={src}
        loading={eager ? 'eager' : imageProps.loading}
        onError={onError}
        {...imageProps}
      />
    )
  }

  const plugins = [
    ...(!eager
      ? [lazyload({ rootMargin: '160px 0px', threshold: 0.01 })]
      : []),
    responsive({ steps: responsiveWidths }),
    placeholder({ mode: 'blur' }),
  ]

  return (
    <AdvancedImage
      cldImg={cloudinaryImage}
      plugins={plugins}
      onError={handleCloudinaryError}
      {...imageProps}
    />
  )
}
