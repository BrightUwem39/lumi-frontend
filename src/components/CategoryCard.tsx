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
      className={`group relative min-h-[300px] overflow-hidden bg-[#c8c1b7] text-white min-[380px]:min-h-[340px] min-[480px]:min-h-[380px] sm:min-h-[440px] xl:min-h-[500px] ${className}`}
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-7">
        {/* A fine rule and quiet metadata give each collection an editorial caption. */}
        <div className="mb-4 h-px w-full bg-white/35" />
        <div className="mb-2 flex items-center justify-between gap-3 text-[8px] font-medium uppercase tracking-[0.2em] text-white/65">
          <span>Lumi edit</span>
          <span>{itemCount ? `${itemCount} pieces` : 'Collection'}</span>
        </div>

        <div className="flex w-full items-end justify-between gap-3">
          <h3 className="min-w-0 overflow-visible whitespace-normal text-[25px] leading-[0.98] tracking-[-0.025em] min-[380px]:truncate min-[380px]:text-[30px] sm:text-[40px]">
            {title}
          </h3>

          <Link
            to={to}
            aria-label={`Explore ${title}`}
            className="pointer-events-auto flex shrink-0 items-center gap-2 border-b border-white/70 pb-1 text-[8px] font-medium uppercase tracking-[0.15em] transition-opacity hover:opacity-55 sm:text-[9px]"
          >
            <span className="hidden min-[360px]:inline">Discover</span>
            <FiArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
