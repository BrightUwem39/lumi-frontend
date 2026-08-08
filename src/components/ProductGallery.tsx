import { useRef, useState } from 'react'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperInstance } from 'swiper'
import { LuChevronLeft as FiChevronLeft, LuChevronRight as FiChevronRight } from 'react-icons/lu'
import 'swiper/css'
import { OptimizedImage } from './OptimizedImage'

export type GalleryImage = {
  src: string
  alt: string
  label: string
  objectPosition?: string
}

type ProductGalleryProps = {
  images: GalleryImage[]
  productName: string
}

// A straightforward product gallery with synchronized thumbnails and controls.
export function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const slider = useRef<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const selectImage = (index: number) => {
    slider.current?.slideTo(index, 0)
    setActiveIndex(index)
  }

  return (
    <div className="grid w-full min-w-0 max-w-full gap-3 overflow-hidden md:w-[488px] md:grid-cols-[400px_72px] md:justify-self-center md:gap-4">
      <div className="relative w-full min-w-0 overflow-hidden bg-[#e8e5df]">
        <Swiper
          modules={[A11y, Keyboard]}
          keyboard={{ enabled: true }}
          slidesPerView={1}
          spaceBetween={0}
          onSwiper={(instance) => {
            slider.current = instance
          }}
          onSlideChange={(instance) => setActiveIndex(instance.activeIndex)}
          aria-label={`${productName} image gallery`}
          className="aspect-[4/5] w-full min-w-0 md:h-[500px] md:aspect-auto"
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image.label}-${index}`}>
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                draggable={false}
                className="size-full select-none object-contain"
                style={{
                  objectPosition: image.objectPosition ?? 'center',
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Compact controls provide explicit navigation without extra gallery effects. */}
        {images.length > 1 && (
          <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-between">
            <div className="bg-black/55 px-3 py-2 text-[9px] tracking-[0.14em] text-white backdrop-blur">
              {String(activeIndex + 1).padStart(2, '0')} /{' '}
              {String(images.length).padStart(2, '0')}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Previous product image"
                onClick={() => slider.current?.slidePrev()}
                className="grid size-10 place-items-center bg-white text-[#171713] transition-colors hover:bg-[#171713] hover:text-white"
              >
                <FiChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next product image"
                onClick={() => slider.current?.slideNext()}
                className="grid size-10 place-items-center bg-white text-[#171713] transition-colors hover:bg-[#171713] hover:text-white"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails remain swipeable on phones, then stand in a compact
          vertical column beside the main image on tablets and desktops. */}
      <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1 md:col-start-2 md:row-start-1 md:h-full md:flex-col md:overflow-visible md:pb-0">
        {images.map((image, index) => (
          <button
            key={`thumbnail-${image.label}-${index}`}
            type="button"
            aria-label={`Show ${image.label}`}
            aria-pressed={activeIndex === index}
            onClick={() => selectImage(index)}
            className={`aspect-[4/5] w-[22%] min-w-16 shrink-0 snap-start overflow-hidden border-2 md:aspect-auto md:min-h-0 md:w-full md:min-w-0 md:flex-1 ${
              activeIndex === index
                ? 'border-ink opacity-100'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <OptimizedImage
              src={image.src}
              alt=""
              className="size-full object-cover"
              style={{
                objectPosition: image.objectPosition ?? 'center',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
