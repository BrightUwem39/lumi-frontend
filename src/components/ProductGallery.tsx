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
  imageScale?: number
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
    <div className="min-w-0">
      <div className="relative overflow-hidden bg-[#e8e5df]">
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
          className="aspect-[4/5]"
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image.label}-${index}`}>
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                draggable={false}
                className="size-full select-none object-cover"
                style={{
                  objectPosition: image.objectPosition ?? 'center',
                  transform: `scale(${image.imageScale ?? 1})`,
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

      {/* Thumbnail selection changes the main image immediately. */}
      <Swiper
        slidesPerView={3.5}
        spaceBetween={8}
        breakpoints={{
          480: { slidesPerView: 4.5, spaceBetween: 10 },
          768: { slidesPerView: 5, spaceBetween: 12 },
        }}
        className="mt-3"
      >
        {images.map((image, index) => (
          <SwiperSlide key={`thumbnail-${image.label}-${index}`}>
            <button
              type="button"
              aria-label={`Show ${image.label}`}
              aria-pressed={activeIndex === index}
              onClick={() => selectImage(index)}
              className={`aspect-[4/5] w-full overflow-hidden border-2 ${
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
                  transform: `scale(${image.imageScale ?? 1})`,
                }}
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
