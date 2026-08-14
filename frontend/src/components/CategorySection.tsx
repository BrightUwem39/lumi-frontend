import { useState } from 'react'
import { CategoryCard } from './CategoryCard'
import { MotionReveal } from './MotionReveal'
import { RailIndicator } from './RailIndicator'
import { getRailIndex } from '../utils/rail'

// Category presentation mirrors an editorial collection index.
const categories = [
  {
    title: 'Women',
    image: '/images/curated/women-edit.jpg',
    to: '/shop?category=Women',
    imagePosition: 'object-[center_28%]',
  },
  {
    title: 'Men',
    image: '/images/curated/men-edit.jpg',
    to: '/shop?category=Men',
    imagePosition: 'object-[center_28%]',
  },
  {
    title: 'Accessories',
    image: '/images/curated/accessories-edit.jpg',
    to: '/shop?category=Accessories',
    imagePosition: 'object-center',
  },
  {
    title: 'Shoes',
    image: '/images/curated/shoes-edit.jpg',
    to: '/shop?category=Shoes',
    imagePosition: 'object-center',
  },
  {
    title: 'Bags',
    image: '/images/curated/bags-edit.jpg',
    to: '/shop?search=bag',
    imagePosition: 'object-center',
  },
]

export function CategorySection() {
  const [activeCard, setActiveCard] = useState(0)

  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="scroll-mt-[82px] bg-canvas px-4 pb-4 pt-5 text-ink sm:scroll-mt-[98px] sm:px-7 sm:pb-6 sm:pt-7 lg:px-10 lg:pb-8 lg:pt-8 xl:scroll-mt-[110px]"
    >
      <div className="mx-auto max-w-[1440px]">
        <MotionReveal className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div className="max-w-xl">
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/50">
              Find your edit
            </p>
            <h2 id="categories-heading" className="text-3xl sm:text-4xl">
              Shop by category
            </h2>
          </div>
          <p className="hidden text-[8px] font-medium uppercase tracking-[0.18em] text-ink/40 sm:block">
            05 collections
          </p>
        </MotionReveal>

        {/* Phones show two cards at once in a swipeable snap rail. Larger
            screens return to a fixed editorial grid. */}
        <div
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 sm:overflow-visible sm:pb-0 xl:grid-cols-5 xl:gap-x-5"
          onScroll={(event) => setActiveCard(getRailIndex(event.currentTarget))}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              {...category}
              className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-auto sm:shrink"
            />
          ))}
        </div>
        <RailIndicator count={categories.length} activeIndex={activeCard} />
      </div>
    </section>
  )
}
