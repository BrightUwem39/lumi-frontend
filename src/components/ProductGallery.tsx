import { useRef, useState, type PointerEvent } from 'react'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperInstance } from 'swiper'
import { FiChevronLeft, FiChevronRight, FiZoomIn } from 'react-icons/fi'
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

// A reusable, touch-friendly gallery with synchronized thumbnails and zoom.
export function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const slider = useRef<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')

  const selectImage = (index: number) => {
    slider.current?.slideTo(index)
    setActiveIndex(index)
    setZoomed(false)
  }

  // The zoom follows the pointer so customers can inspect a specific detail.
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
    setZoomed(true)
  }

  return (
    <div className="min-w-0">
      <div className="group relative overflow-hidden bg-[#e8e5df]">
        <Swiper
          modules={[A11y, Keyboard]}
          keyboard={{ enabled: true }}
          slidesPerView={1}
          spaceBetween={0}
          onSwiper={(instance) => {
            slider.current = instance
          }}
          onSlideChange={(instance) => {
            setActiveIndex(instance.activeIndex)
            setZoomed(false)
          }}
          aria-label={`${productName} image gallery`}
          className="aspect-[4/5]"
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image.label}-${index}`}>
              <div
                className="relative size-full cursor-zoom-in overflow-hidden"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setZoomed(false)}
                onPointerUp={(event) => {
                  if (event.pointerType !== 'mouse') setZoomed((value) => !value)
                }}
              >
                <OptimizedImage
                  src={image.src}
                  alt={image.alt}
                  draggable={false}
                  className="size-full select-none object-cover transition-transform duration-300 ease-out"
                  style={{
                    objectPosition: image.objectPosition ?? 'center',
                    transformOrigin: zoomOrigin,
                    transform: `scale(${
                      zoomed && activeIndex === index
                        ? 1.75
                        : image.imageScale ?? 1
                    })`,
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 bg-white/90 px-3 py-2 text-[8px] uppercase tracking-[0.14em] text-[#171713] backdrop-blur">
          <FiZoomIn size={13} />
          <span className="sm:hidden">Tap to zoom</span>
          <span className="hidden sm:inline">Hover to zoom</span>
        </div>

        {/* Custom controls remain large enough for touch and match the store UI. */}
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
                className="grid size-11 place-items-center bg-white text-[#171713] transition-colors hover:bg-[#171713] hover:text-white"
              >
                <FiChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next product image"
                onClick={() => slider.current?.slideNext()}
                className="grid size-11 place-items-center bg-white text-[#171713] transition-colors hover:bg-[#171713] hover:text-white"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail slider supports horizontal swiping when it exceeds the viewport. */}
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
              className={`aspect-[4/5] w-full overflow-hidden border-2 transition-opacity ${
                activeIndex === index
                  ? 'border-ink opacity-100'
                  : 'border-transparent opacity-55 hover:opacity-100'
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
