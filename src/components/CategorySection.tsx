import { useState } from 'react'
import { CategoryCard } from './CategoryCard'
import { MotionReveal } from './MotionReveal'
import { RailIndicator } from './RailIndicator'
import { getRailIndex } from '../utils/rail'

// Category data can later come from the backend without changing the card.
const categories = [
  {
    title: 'Women',
    image: '/images/curated/women-edit.jpg',
    to: '/shop?category=Women',
    itemCount: 84,
    imagePosition: 'object-[center_28%]',
  },
  {
    title: 'Men',
    image: '/images/curated/men-edit.jpg',
    to: '/shop?category=Men',
    itemCount: 62,
    imagePosition: 'object-[center_28%]',
  },
  {
    title: 'Accessories',
    image: '/images/curated/accessories-edit.jpg',
    to: '/shop?category=Accessories',
    itemCount: 38,
    imagePosition: 'object-center',
  },
  {
    title: 'Shoes',
    image: '/images/curated/shoes-edit.jpg',
    to: '/shop?category=Shoes',
    itemCount: 29,
    imagePosition: 'object-center',
  },
  {
    title: 'Bags',
    image: '/images/curated/bags-edit.jpg',
    to: '/shop?search=bag',
    itemCount: 21,
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

        {/* Categories remain in one row at every width. Phones and tablets can
            swipe the rail, while desktop fits all five cards side by side. */}
        <div
          className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 sm:gap-4 lg:overflow-visible"
          onScroll={(event) => setActiveCard(getRailIndex(event.currentTarget))}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              {...category}
              className="w-[82vw] max-w-[340px] shrink-0 snap-start sm:w-[42vw] lg:w-[calc((100%-4rem)/5)] lg:max-w-none"
            />
          ))}
        </div>
        <RailIndicator count={categories.length} activeIndex={activeCard} />
      </div>
    </section>
  )
}
