import { motion } from 'framer-motion'
import { LuArrowUpRight as FiArrowUpRight } from 'react-icons/lu'
import { Link } from 'react-router-dom'

type CategoryCardProps = {
  title: string
  image: string
  to: string
  itemCount?: number
  className?: string
  imagePosition?: string
}

// Reusable category card; layout size and image crop are controlled by props.
export function CategoryCard({
  title,
  image,
  to,
  itemCount,
  className = '',
  imagePosition = 'object-center',
}: CategoryCardProps) {
  return (
    <motion.article
      className={`group relative aspect-[3/5] min-h-0 overflow-hidden bg-[#c8c1b7] text-white ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
      whileHover={{ y: -5 }}
    >
      {/* The entire image area links to the selected category. */}
      <Link to={to} aria-label={`Explore ${title}`} className="absolute inset-0">
        <img
          src={image}
          alt={`${title} collection`}
          loading="lazy"
          decoding="async"
          className={`size-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.075] ${imagePosition}`}
        />
      </Link>

      {/* Gradient protects the title and button over both light and dark photos. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/10" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/35 pb-3 text-[7px] font-medium uppercase tracking-[0.16em] text-white/65">
          <span>Collection</span>
          <span>{itemCount ? `${itemCount} pieces` : 'Explore'}</span>
        </div>

        <div className="flex w-full items-end justify-between gap-2">
          <h3 className="min-w-0 truncate text-[22px] leading-none tracking-[-0.02em] sm:text-[25px] lg:text-[clamp(1.05rem,1.65vw,1.5rem)] xl:text-[26px]">
            {title}
          </h3>

          <Link
            to={to}
            aria-label={`Explore ${title}`}
            className="pointer-events-auto grid size-8 shrink-0 place-items-center border border-white/55 transition-colors hover:bg-white hover:text-[#171713]"
          >
            <FiArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
