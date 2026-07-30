import { motion } from 'framer-motion'
import { FiArrowUpRight } from 'react-icons/fi'

type CategoryCardProps = {
  title: string
  image: string
  href: string
  itemCount?: number
  className?: string
  imagePosition?: string
}

// Reusable category card; layout size and image crop are controlled by props.
export function CategoryCard({
  title,
  image,
  href,
  itemCount,
  className = '',
  imagePosition = 'object-center',
}: CategoryCardProps) {
  return (
    <motion.article
      className={`group relative min-h-[340px] overflow-hidden bg-[#c8c1b7] text-white min-[420px]:min-h-[390px] sm:min-h-[440px] xl:min-h-[500px] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
    >
      {/* The entire image area links to the selected category. */}
      <a href={href} aria-label={`Explore ${title}`} className="absolute inset-0">
        <img
          src={image}
          alt={`${title} collection`}
          loading="lazy"
          decoding="async"
          className={`size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] ${imagePosition}`}
        />
      </a>

      {/* Gradient protects the title and button over both light and dark photos. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 min-h-[116px] p-4 sm:min-h-[132px] sm:p-7">
        {/* A fixed footer structure keeps metadata, titles, and buttons aligned
            across short and long category names. */}
        <p className="mb-2 h-3 text-[8px] font-medium uppercase tracking-[0.2em] text-white/65">
          {itemCount ? `${itemCount} pieces` : '\u00A0'}
        </p>

        <div className="flex w-full items-center justify-between gap-3">
          <h3 className="min-w-0 truncate text-[25px] leading-none min-[380px]:text-[28px] sm:text-4xl">
            {title}
          </h3>

          <a
            href={href}
            className="pointer-events-auto flex min-h-10 shrink-0 items-center gap-1.5 border border-white/70 px-3 text-[8px] font-medium uppercase tracking-[0.13em] backdrop-blur-sm transition-colors hover:bg-white hover:text-[#171713] sm:min-h-11 sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[0.16em]"
          >
            Explore
            <FiArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </motion.article>
  )
}
