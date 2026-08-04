import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { OptimizedImage } from '../components/OptimizedImage'

const stories = [
  {
    id: 'quiet-tailoring',
    number: '01',
    title: 'The ease of quiet tailoring',
    excerpt: 'A closer look at softened structure, generous proportions, and the pieces that make getting dressed feel simple.',
    image: '/images/editorial/atelier-trouser-street-v2.jpg',
    category: 'In the studio',
  },
  {
    id: 'summer-light',
    number: '02',
    title: 'Dressing for summer light',
    excerpt: 'Breathable layers and warm neutrals chosen for long afternoons, unhurried dinners, and everything between.',
    image: '/images/editorial/lumi-lagos-campaign-v2.jpg',
    category: 'The seasonal edit',
  },
  {
    id: 'objects-kept',
    number: '03',
    title: 'Objects worth keeping',
    excerpt: 'Why thoughtful materials, repairable construction, and daily usefulness matter more than passing novelty.',
    image: '/images/editorial/arc-sunglasses-cafe-v2.jpg',
    category: 'Design notes',
  },
]

export function JournalPage() {
  return (
    <main className="bg-canvas text-ink">
      <header className="border-b border-line px-4 py-10 min-[480px]:py-12 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[9px] uppercase tracking-[0.2em] text-ink/50">Stories from Lumi</p>
          <h1 className="mt-3 text-[clamp(2.75rem,13vw,4rem)] leading-none">Journal</h1>
          <p className="mt-4 max-w-lg text-[13px] leading-6 text-ink/60 sm:text-sm">Notes on clothes, materials, and the small choices behind what we make.</p>
        </div>
      </header>

      <section aria-label="Journal stories" className="px-4 py-9 min-[480px]:py-10 sm:px-7 sm:py-12 lg:px-10 lg:py-16">
        {/* Tablet cards switch to two columns before the conventional 768px breakpoint. */}
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-x-5 gap-y-10 min-[680px]:grid-cols-2 min-[680px]:gap-y-12 xl:grid-cols-3 xl:gap-x-8">
          {stories.map((story, index) => (
            <motion.article
              id={story.id}
              key={story.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.06 }}
              className="min-w-0 scroll-mt-32"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#e8e5df]">
                <OptimizedImage
                  src={story.image}
                  alt=""
                  responsiveWidths={[480, 720, 960]}
                  className="size-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
              <div className="mt-4 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 sm:mt-5 sm:gap-4">
                <span className="pt-1 text-[9px] text-ink/40">{story.number}</span>
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-ink/45">{story.category}</p>
                  <h2 className="mt-2 break-words text-xl leading-tight min-[420px]:text-2xl min-[680px]:text-xl lg:text-2xl">{story.title}</h2>
                  <p className="mt-3 break-words text-xs leading-5 text-ink/55">{story.excerpt}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
        <div className="mx-auto mt-11 max-w-[1440px] border-t border-line pt-7 text-center sm:mt-14 sm:pt-8">
          <Link to="/shop" className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-7 text-[9px] uppercase tracking-[0.17em] text-canvas min-[420px]:w-auto">Explore the collection</Link>
        </div>
      </section>
    </main>
  )
}
