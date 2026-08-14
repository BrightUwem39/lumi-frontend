import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

type CategoryCardProps = {
  title: string
  image: string
  to: string
  className?: string
  imagePosition?: string
}

// Reusable category card; layout size and image crop are controlled by props.
export function CategoryCard({
  title,
  image,
  to,
  className = '',
  imagePosition = 'object-center',
}: CategoryCardProps) {
  return (
    <motion.article
      className={`group flex min-w-0 flex-col text-ink ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
      whileHover={{ y: -5 }}
    >
      <Link
        to={to}
        aria-label={`Explore ${title}`}
        className="block aspect-[3/5] overflow-hidden bg-[#c8c1b7]"
      >
        <img
          src={image}
          alt={`${title} collection`}
          loading="lazy"
          decoding="async"
          className={`size-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.075] ${imagePosition}`}
        />
      </Link>

      <div className="flex flex-1 flex-col items-center pt-4 text-center sm:pt-5">
        <h3 className="min-w-0 text-[14px] font-medium uppercase leading-tight tracking-[0.08em] sm:text-[17px] lg:text-[18px]">
          {title}
        </h3>
        <Link
          to={to}
          aria-label={`Shop ${title}`}
          className="mt-4 flex min-h-11 w-full max-w-44 items-center justify-center border border-ink px-3 text-[8px] font-medium uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-canvas sm:mt-5 sm:min-h-12 sm:text-[9px]"
        >
          Shop now
        </Link>
      </div>
    </motion.article>
  )
}
