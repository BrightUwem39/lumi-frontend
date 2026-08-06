import { LuCheck as FiCheck, LuStar as FiStar } from 'react-icons/lu'

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
    <article className="relative flex h-full min-h-[250px] flex-col overflow-hidden border border-ink/18 p-5 sm:min-h-[275px] sm:p-6">
      <span aria-hidden="true" className="absolute right-5 top-2 font-display text-7xl leading-none text-ink/[0.07]">
        “
      </span>

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[8px] font-medium uppercase tracking-[0.17em] text-ink/55">
          <span className="grid size-4 place-items-center rounded-full border border-ink/30">
            <FiCheck size={10} />
          </span>
          Verified purchase
        </div>
        <div
          aria-label={`${testimonial.rating} out of 5 stars`}
          className="flex items-center gap-1.5 text-[10px] text-ink/75"
        >
          <FiStar size={11} fill="currentColor" strokeWidth={1.2} />
          {testimonial.rating.toFixed(1)}
        </div>
      </div>

      <blockquote className="relative my-auto py-6 sm:py-7">
        <p className="text-[15px] leading-[1.6] text-ink/90 sm:text-[17px]">
          “{testimonial.review}”
        </p>
      </blockquote>

      <footer className="flex items-center gap-3 border-t border-ink/15 pt-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          loading="lazy"
          decoding="async"
          className={`size-10 rounded-full border border-ink/20 object-cover sm:size-11 ${testimonial.imagePosition ?? 'object-center'}`}
        />
        <div>
          <cite className="not-italic text-sm font-medium">
            {testimonial.name}
          </cite>
          <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-ink/48">
            {testimonial.location}
          </p>
        </div>
      </footer>
    </article>
  )
}
