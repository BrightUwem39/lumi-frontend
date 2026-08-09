import { A11y, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import { TestimonialCard, type Testimonial } from './TestimonialCard'
import { MotionReveal } from './MotionReveal'

// Testimonial data is separate from the card so it can later come from an API.
const testimonials: Testimonial[] = [
  {
    id: 'amara-okafor',
    name: 'Amara Okafor',
    location: 'Lagos, Nigeria',
    image: '/images/editorial/community-amara-v2.jpg',
    imagePosition: 'object-center',
    rating: 5,
    review:
      'The pieces feel even better than they look online. My linen set has already become the first thing I reach for on warm days.',
  },
  {
    id: 'elise-martin',
    name: 'Elise Martin',
    location: 'Paris, France',
    image: '/images/editorial/community-elise-v2.jpg',
    imagePosition: 'object-center',
    rating: 5,
    review:
      'The Luna dress falls beautifully and needed no alterations. It arrived thoughtfully packed, and the fabric feels genuinely special.',
  },
  {
    id: 'daniel-brooks',
    name: 'Daniel Brooks',
    location: 'London, United Kingdom',
    image: '/images/editorial/community-daniel-v2.jpg',
    imagePosition: 'object-center',
    rating: 5,
    review:
      'The blazer has the relaxed shape I wanted without losing its structure. I have worn it to work, dinner, and nearly everywhere between.',
  },
  {
    id: 'maya-chen',
    name: 'Maya Chen',
    location: 'Toronto, Canada',
    image: '/images/editorial/community-maya-v2.jpg',
    imagePosition: 'object-center',
    rating: 4,
    review:
      'Everything feels considered, from the fit to the small finishing details. The sizing notes were accurate and made ordering simple.',
  },
]

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="bg-canvas px-4 pb-4 pt-4 text-ink sm:px-7 sm:pb-6 sm:pt-6 lg:px-10 lg:pb-8 lg:pt-8"
    >
      <div className="mx-auto max-w-[1440px]">
        <MotionReveal className="mb-6 max-w-xl sm:mb-8">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/55">
            Worn and loved
          </p>
          <h2 id="testimonials-heading" className="text-3xl sm:text-4xl">
            What our community says
          </h2>
        </MotionReveal>

        {/* Swiper provides touch dragging, keyboard-friendly pagination,
            and breakpoint-specific card counts. */}
        <Swiper
          modules={[Pagination, A11y]}
          pagination={{ clickable: true }}
          spaceBetween={12}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 18 },
          }}
          className="testimonial-swiper !pb-9"
        >
          {testimonials.map((testimonial) => (
            <SwiperSlide key={testimonial.id} className="!h-auto">
              <TestimonialCard testimonial={testimonial} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
