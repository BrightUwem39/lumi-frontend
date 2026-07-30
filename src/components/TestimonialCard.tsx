import { FiStar } from 'react-icons/fi'

export type Testimonial = {
  id: string
  name: string
  location: string
  image: string
  imagePosition?: string
  review: string
  rating: number
}

type TestimonialCardProps = {
  testimonial: Testimonial
}

// Reusable review card; all customer-specific content is supplied as data.
export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <article className="flex h-full min-h-[260px] flex-col border border-canvas/20 p-5 sm:min-h-[285px] sm:p-6">
      <div
        aria-label={`${testimonial.rating} out of 5 stars`}
        className="flex gap-1 text-canvas"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <FiStar
            key={index}
            size={14}
            strokeWidth={1.4}
            fill={index < testimonial.rating ? 'currentColor' : 'none'}
            className={index < testimonial.rating ? '' : 'opacity-30'}
          />
        ))}
      </div>

      <blockquote className="my-auto py-5 sm:py-6">
        <p className="text-base leading-[1.5] sm:text-lg">
          “{testimonial.review}”
        </p>
      </blockquote>

      <footer className="flex items-center gap-3 border-t border-canvas/15 pt-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          loading="lazy"
          decoding="async"
          className={`size-10 rounded-full object-cover sm:size-11 ${testimonial.imagePosition ?? 'object-center'}`}
        />
        <div>
          <cite className="not-italic text-sm font-medium">
            {testimonial.name}
          </cite>
          <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-canvas/55">
            {testimonial.location}
          </p>
        </div>
      </footer>
    </article>
  )
}
