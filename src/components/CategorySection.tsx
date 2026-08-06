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
    className: 'xl:col-span-8',
    imagePosition: 'object-[center_28%]',
  },
  {
    title: 'Men',
    image: '/images/curated/men-edit.jpg',
    to: '/shop?category=Men',
    itemCount: 62,
    className: 'xl:col-span-4',
    imagePosition: 'object-[center_28%]',
  },
  {
    title: 'Accessories',
    image: '/images/curated/accessories-edit.jpg',
    to: '/shop?category=Accessories',
    itemCount: 38,
    className: 'xl:col-span-4',
    imagePosition: 'object-center',
  },
  {
    title: 'Shoes',
    image: '/images/curated/shoes-edit.jpg',
    to: '/shop?category=Shoes',
    itemCount: 29,
    className: 'xl:col-span-4',
    imagePosition: 'object-center',
  },
  {
    title: 'Bags',
    image: '/images/curated/bags-edit.jpg',
    to: '/shop?search=bag',
    itemCount: 21,
    className: 'xl:col-span-4',
    imagePosition: 'object-center',
  },
  {
    title: 'New arrivals',
    image: '/images/curated/new-arrivals-edit.jpg',
    to: '/shop?sort=latest',
    itemCount: 46,
    className: 'xl:col-span-12 xl:min-h-[430px]',
    imagePosition: 'object-center',
  },
]

export function CategorySection() {
  const [activeCard, setActiveCard] = useState(0)

  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="scroll-mt-[92px] bg-canvas px-4 pb-8 pt-5 text-ink min-[380px]:pb-10 sm:scroll-mt-[108px] sm:px-7 sm:pb-12 sm:pt-7 lg:px-10 lg:pb-16 lg:pt-8 xl:scroll-mt-[120px]"
    >
      <div className="mx-auto max-w-[1440px]">
        <MotionReveal className="mb-4 flex items-end justify-between gap-4 sm:mb-7">
          <div className="max-w-xl">
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/50">
              Find your edit
            </p>
            <h2 id="categories-heading" className="text-3xl sm:text-4xl">
              Shop by category
            </h2>
          </div>
        </MotionReveal>

        {/* Phones swipe through snap-aligned cards; larger screens retain the
            editorial grid so every category is visible at once. */}
        <div
          className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 xl:grid-cols-12"
          onScroll={(event) => setActiveCard(getRailIndex(event.currentTarget))}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              {...category}
              className={`w-full shrink-0 snap-center sm:w-auto sm:shrink ${category.className}`}
            />
          ))}
        </div>
        <RailIndicator count={categories.length} activeIndex={activeCard} />
      </div>
    </section>
  )
}
