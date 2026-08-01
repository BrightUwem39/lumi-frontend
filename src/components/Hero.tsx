import { motion } from 'framer-motion'
import { FiArrowDownRight, FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { OptimizedImage } from './OptimizedImage'

// Shared entrance style keeps the text elements moving consistently.
const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function Hero() {
  return (
    // Viewport-based heights fill the screen after each responsive navbar height.
    <section
      aria-labelledby="hero-heading"
      className="relative isolate min-h-[calc(100svh-92px)] overflow-hidden bg-[#9b8c7c] text-white sm:min-h-[calc(100svh-108px)] xl:min-h-[calc(100svh-120px)]"
    >
      {/* The campaign image is content, so it has descriptive alt text.
          Object positions keep the model visible as the viewport narrows. */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <OptimizedImage
          src="/images/lumi-summer-hero.png"
          alt="Model wearing an ivory linen summer look beside Mediterranean architecture"
          fetchPriority="high"
          decoding="async"
          eager
          responsiveWidths={[640, 960, 1280, 1600, 1920]}
          className="absolute inset-0 size-full object-cover object-[68%_center] sm:object-[64%_center] lg:object-center"
        />
      </motion.div>

      {/* Responsive overlays preserve text contrast without hiding the photograph. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/15 sm:bg-gradient-to-r sm:from-black/55 sm:via-black/15 sm:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 sm:hidden" />

      {/* Main campaign copy aligns to the bottom on phones and vertically
          centers on larger screens. */}
      <div className="relative mx-auto flex min-h-[calc(100svh-92px)] max-w-[1440px] items-end px-4 pb-6 pt-14 min-[380px]:px-5 min-[380px]:pb-8 sm:min-h-[calc(100svh-108px)] sm:items-center sm:px-8 sm:pb-14 sm:pt-14 lg:px-12 xl:min-h-[calc(100svh-120px)] xl:px-16">
        <motion.div
          className="w-full max-w-xl sm:max-w-lg lg:max-w-2xl"
          initial={false}
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.25 }}
        >
          {/* Eyebrow identifies the featured seasonal release. */}
          <motion.div
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mb-4 flex items-center gap-3 sm:mb-6"
          >
            <span className="h-px w-8 bg-white/75" />
            <p className="text-[9px] font-medium uppercase tracking-[0.25em] sm:text-[10px]">
              Just in · The summer edit
            </p>
          </motion.div>

          {/* One H1 communicates the page's primary campaign message. */}
          <motion.h1
            id="hero-heading"
            variants={reveal}
            transition={{ duration: 0.75 }}
            className="max-w-[10ch] break-words font-hero text-[clamp(2.45rem,12.5vw,4rem)] leading-[0.92] tracking-[-0.035em] min-[380px]:text-[clamp(2.8rem,12vw,4.5rem)] sm:text-[clamp(4.5rem,8vw,7rem)] lg:max-w-[10ch]"
          >
            ELEVATE YOUR EVERYDAY STYLE
          </motion.h1>

          {/* Supporting copy gives the collection a more human brand voice. */}
          <motion.p
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mt-4 max-w-[31ch] text-[12px] leading-5 text-white/85 min-[380px]:mt-5 sm:mt-7 sm:max-w-md sm:text-sm sm:leading-6"
          >
            Discover thoughtfully crafted pieces that blend timeless design
            with modern elegance.
          </motion.p>

          {/* Primary and secondary CTAs stack on narrow phones and share a row
              when enough width is available. */}
          <motion.div
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mt-5 flex max-w-full flex-col gap-2 min-[380px]:mt-6 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3"
          >
            <Link
              to="/shop"
              className="group flex min-h-12 w-full items-center justify-center gap-3 bg-white px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#171713] transition-colors hover:bg-[#171713] hover:text-white sm:w-auto sm:min-w-48 sm:px-6 sm:tracking-[0.18em]"
            >
              Shop the edit
              <FiArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              to="/#products"
              className="group flex min-h-12 w-full items-center justify-center gap-3 border border-white/70 bg-black/5 px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-[2px] transition-colors hover:bg-white hover:text-[#171713] sm:w-auto sm:min-w-48 sm:px-6 sm:tracking-[0.18em]"
            >
              See what’s new
              <FiArrowDownRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
              />
            </Link>
          </motion.div>

          {/* Tertiary link offers a quieter path to the complete collection. */}
          <motion.div
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mt-5"
          >
            <Link
              to="/shop?sort=latest"
              className="hidden max-w-full whitespace-normal border-b border-white/65 pb-1 text-[9px] font-medium uppercase leading-4 tracking-[0.15em] transition-opacity hover:opacity-60 min-[420px]:inline-flex sm:tracking-[0.2em]"
            >
              Explore the full summer collection
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Editorial campaign metadata is decorative and only shown when space allows. */}
      <div className="absolute bottom-8 right-8 hidden items-center gap-3 text-[9px] uppercase tracking-[0.2em] text-white/70 lg:flex">
        <span>Campaign 01</span>
        <span className="h-px w-10 bg-white/50" />
        <span>Mediterranean light</span>
      </div>
    </section>
  )
}
