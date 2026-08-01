import { motion } from 'framer-motion'
import { FiArrowUpRight } from 'react-icons/fi'
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
      className={`group relative min-h-[300px] overflow-hidden bg-[#c8c1b7] text-white min-[380px]:min-h-[340px] min-[480px]:min-h-[380px] sm:min-h-[440px] xl:min-h-[500px] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
    >
      {/* The entire image area links to the selected category. */}
      <Link to={to} aria-label={`Explore ${title}`} className="absolute inset-0">
        <img
          src={image}
          alt={`${title} collection`}
          loading="lazy"
          decoding="async"
          className={`size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] ${imagePosition}`}
        />
      </Link>

      {/* Gradient protects the title and button over both light and dark photos. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 min-h-[116px] p-4 sm:min-h-[132px] sm:p-7">
        {/* A fixed footer structure keeps metadata, titles, and buttons aligned
            across short and long category names. */}
        <p className="mb-2 h-3 text-[8px] font-medium uppercase tracking-[0.2em] text-white/65">
          {itemCount ? `${itemCount} pieces` : '\u00A0'}
        </p>

        <div className="flex w-full items-center justify-between gap-3">
          <h3 className="min-w-0 overflow-visible whitespace-normal text-[24px] leading-[1.05] min-[380px]:truncate min-[380px]:text-[28px] sm:text-4xl">
            {title}
          </h3>

          <Link
            to={to}
            aria-label={`Explore ${title}`}
            className="pointer-events-auto grid size-10 shrink-0 place-items-center border border-white/70 text-[8px] font-medium uppercase tracking-[0.13em] backdrop-blur-sm transition-colors hover:bg-white hover:text-[#171713] min-[380px]:flex min-[380px]:w-auto min-[380px]:gap-1.5 min-[380px]:px-3 sm:min-h-11 sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[0.16em]"
          >
            <span className="hidden min-[380px]:inline">Explore</span>
            <FiArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
