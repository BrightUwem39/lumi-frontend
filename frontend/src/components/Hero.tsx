import { motion, useReducedMotion } from 'framer-motion'
import { Parallax } from 'react-scroll-parallax'
import { LuArrowRight as FiArrowRight } from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { OptimizedImage } from './OptimizedImage'
import { Magnet } from './reactbits/Magnet'
import { SplitText } from './reactbits/SplitText'

// Shared entrance style keeps the text elements moving consistently.
const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    // Viewport-based heights fill the screen after each responsive navbar height.
    <section
      aria-labelledby="hero-heading"
      className="relative isolate min-h-[calc(100svh-78px)] overflow-hidden bg-[#7f837d] text-white sm:min-h-[calc(100svh-92px)] xl:min-h-[calc(100svh-102px)]"
    >
      {/* One optimized campaign image is shared across every viewport. Its
          responsive fit preserves the full pose on wide screens and uses a
          model-focused horizontal crop on portrait screens. */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* A sharp, height-matched wall extension fills the narrow space beside
            the contained photograph without blurring or enlarging the model. */}
        <div
          className="absolute inset-0 bg-left bg-no-repeat [background-size:auto_100%] portrait:hidden"
          style={{ backgroundImage: "url('/images/editorial/lumi-lagos-campaign-v2.jpg')" }}
        />
        <motion.div
          className="relative size-full"
          initial={reduceMotion ? false : { opacity: 0.82 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <OptimizedImage
            src="/images/editorial/lumi-lagos-campaign-v2.jpg"
            alt=""
            fetchPriority="high"
            decoding="async"
            eager
            responsiveWidths={[640, 960, 1280, 1600, 1920]}
            className="size-full object-contain object-center portrait:object-cover portrait:object-[72%_center] lg:object-contain lg:object-right"
          />
        </motion.div>
      </div>

      {/* Responsive overlays preserve text contrast without hiding the photograph. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/15 sm:bg-gradient-to-r sm:from-black/55 sm:via-black/15 sm:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 sm:hidden" />

      {/* The foreground travels slightly faster than the campaign image,
          creating depth while keeping every CTA easy to interact with. */}
      <Parallax speed={reduceMotion ? 0 : 4} className="relative">
        <div className="relative mx-auto flex min-h-[calc(100svh-78px)] max-w-[1440px] items-end px-4 pb-6 pt-14 min-[380px]:px-5 min-[380px]:pb-8 sm:min-h-[calc(100svh-92px)] sm:items-center sm:px-8 sm:pb-14 sm:pt-14 lg:px-12 xl:min-h-[calc(100svh-102px)] xl:px-16">
        <motion.div
          className="w-full max-w-xl sm:max-w-lg lg:max-w-2xl"
            initial={reduceMotion ? false : 'hidden'}
            animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.25 }}
        >
          {/* One H1 communicates the page's primary campaign message. */}
          {reduceMotion ? (
            <h1
              id="hero-heading"
              className="max-w-[10ch] break-words font-hero text-[clamp(2.45rem,12.5vw,4rem)] leading-[0.92] tracking-[-0.035em] min-[380px]:text-[clamp(2.8rem,12vw,4.5rem)] sm:text-[clamp(4.5rem,8vw,7rem)] lg:max-w-[10ch]"
            >
              ELEVATE YOUR EVERYDAY STYLE
            </h1>
          ) : (
            <SplitText
              id="hero-heading"
              tag="h1"
              text="ELEVATE YOUR EVERYDAY STYLE"
              splitType="words"
              delay={70}
              duration={0.9}
              from={{ opacity: 0, y: 54 }}
              to={{ opacity: 1, y: 0 }}
              className="max-w-[10ch] break-words font-hero text-[clamp(2.45rem,12.5vw,4rem)] leading-[0.92] tracking-[-0.035em] min-[380px]:text-[clamp(2.8rem,12vw,4.5rem)] sm:text-[clamp(4.5rem,8vw,7rem)] lg:max-w-[10ch]"
            />
          )}

          {/* Supporting copy gives the collection a more human brand voice. */}
          <motion.p
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mt-4 max-w-[31ch] text-[12px] leading-5 text-white/85 min-[380px]:mt-5 sm:mt-7 sm:max-w-md sm:text-sm sm:leading-6"
          >
            Discover thoughtfully crafted pieces that blend timeless design
            with modern elegance.
          </motion.p>

          {/* The primary CTA uses a restrained magnetic interaction on precise pointers. */}
          <motion.div
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mt-5 flex max-w-full flex-col gap-2 min-[380px]:mt-6 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3"
          >
            <Magnet
              disabled={Boolean(reduceMotion)}
              wrapperClassName="w-full sm:w-auto"
              innerClassName="w-full"
            >
              <Link
                to="/shop"
                className="group flex min-h-12 w-full items-center justify-center gap-3 bg-white px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#171713] transition-colors hover:bg-[#171713] hover:text-white sm:min-w-48 sm:px-6 sm:tracking-[0.18em]"
              >
                Go to shop
                <FiArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Magnet>
          </motion.div>
        </motion.div>
        </div>
      </Parallax>
    </section>
  )
}
