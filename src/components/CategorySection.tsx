import { CategoryCard } from './CategoryCard'

// Category data can later come from the backend without changing the card.
const categories = [
  {
    title: 'Women',
    image: '/images/products/luna-silk-dress.webp',
    to: '/shop?category=Women',
    itemCount: 84,
    className: 'xl:col-span-8',
    imagePosition: 'object-[center_22%]',
  },
  {
    title: 'Men',
    image: '/images/products/charcoal-wool-blazer.webp',
    to: '/shop?category=Men',
    itemCount: 62,
    className: 'xl:col-span-4',
    imagePosition: 'object-[center_18%]',
  },
  {
    title: 'Accessories',
    image: '/images/products/crescent-leather-bag.webp',
    to: '/shop?category=Accessories',
    itemCount: 38,
    className: 'xl:col-span-4',
    imagePosition: 'object-center',
  },
  {
    title: 'Shoes',
    image: '/images/products/column-ankle-boots.webp',
    to: '/shop?category=Shoes',
    itemCount: 29,
    className: 'xl:col-span-4',
    imagePosition: 'object-center',
  },
  {
    title: 'Bags',
    image: '/images/products/crescent-leather-bag.webp',
    to: '/shop?search=bag',
    itemCount: 21,
    className: 'xl:col-span-4',
    imagePosition: 'object-[65%_center]',
  },
  {
    title: 'New arrivals',
    image: '/images/lumi-summer-hero.png',
    to: '/shop?sort=latest',
    itemCount: 46,
    className: 'xl:col-span-12 xl:min-h-[430px]',
    imagePosition: 'object-[68%_center]',
  },
]

export function CategorySection() {
  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="bg-canvas px-4 pb-16 pt-6 text-ink sm:px-7 sm:pb-20 sm:pt-8 lg:px-10 lg:pb-24 lg:pt-10"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 max-w-xl sm:mb-10">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/50">
            Find your edit
          </p>
          <h2 id="categories-heading" className="text-3xl sm:text-4xl">
            Shop by category
          </h2>
        </div>

        {/* One column on narrow phones, two columns from tablet size, and a
            twelve-column editorial composition on wide desktop screens. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-12">
          {categories.map((category) => (
            <CategoryCard key={category.title} {...category} />
          ))}
        </div>
      </div>
    </section>
  )
}
