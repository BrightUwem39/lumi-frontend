import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  LuCheck as FiCheck,
  LuChevronDown as FiChevronDown,
  LuSlidersHorizontal as FiSliders,
} from 'react-icons/lu'

export type PriceFilter =
  | 'all'
  | '10-50'
  | '50-150'
  | '150-250'
  | 'over-250'

export type ProductFilterProps = {
  category: string
  categories: string[]
  setCategory: (value: string) => void
  price: PriceFilter
  setPrice: (value: PriceFilter) => void
  sizes: string[]
  selectedSizes: string[]
  toggleSize: (value: string) => void
  colors: { name: string; hex: string }[]
  selectedColors: string[]
  toggleColor: (value: string) => void
  minRating: number
  setMinRating: (value: number) => void
  availability: 'all' | 'in-stock' | 'out-of-stock'
  setAvailability: (value: 'all' | 'in-stock' | 'out-of-stock') => void
  resetFilters: () => void
  animated?: boolean
}

const priceOptions: { label: string; value: PriceFilter }[] = [
  { label: 'All prices', value: 'all' },
  { label: '$10 – $50', value: '10-50' },
  { label: '$50 – $150', value: '50-150' },
  { label: '$150 – $250', value: '150-250' },
  { label: '$250+', value: 'over-250' },
]

// Nested variants reveal filter groups first, then each choice within the group.
const filterRootVariants: Variants = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.08, staggerChildren: 0.065 },
  },
}

const filterGroupVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.028,
    },
  },
}

const filterOptionVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
}

// Reusable filter UI shared by the fixed desktop sidebar and mobile drawer.
export function ProductFilters({
  category,
  categories,
  setCategory,
  price,
  setPrice,
  sizes,
  selectedSizes,
  toggleSize,
  colors,
  selectedColors,
  toggleColor,
  minRating,
  setMinRating,
  availability,
  setAvailability,
  resetFilters,
  animated = false,
}: ProductFilterProps) {
  const reduceMotion = useReducedMotion()
  const activeCount =
    (category === 'All' ? 0 : 1) +
    (price === 'all' ? 0 : 1) +
    selectedSizes.length +
    selectedColors.length +
    (minRating === 0 ? 0 : 1) +
    (availability === 'all' ? 0 : 1)

  return (
    <motion.div
      className="min-w-0"
      variants={filterRootVariants}
      initial={animated && !reduceMotion ? 'hidden' : false}
      animate="visible"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center border border-line bg-ink/[0.03]">
            <FiSliders size={15} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm">Refine</h2>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.13em] text-ink/40">
              {activeCount ? `${activeCount} active` : 'All products'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          disabled={activeCount === 0}
          className="text-[8px] font-medium uppercase tracking-[0.14em] text-ink/55 transition-colors hover:text-ink disabled:cursor-default disabled:opacity-30"
        >
          Clear all
        </button>
      </div>

      <FilterGroup title="Category" count={category === 'All' ? 0 : 1} initiallyOpen>
        <div className="space-y-1">
          {categories.map((item) => (
            <FilterCheckbox
              key={item}
              label={item}
              checked={category === item}
              onChange={() => setCategory(item)}
              radio
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price" count={price === 'all' ? 0 : 1} initiallyOpen>
        <div className="space-y-1">
          {priceOptions.map((option) => (
            <FilterCheckbox
              key={option.value}
              label={option.label}
              checked={price === option.value}
              onChange={() => setPrice(option.value)}
              radio
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Size" count={selectedSizes.length} initiallyOpen>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => {
            const selected = selectedSizes.includes(size)
            return (
              <motion.button
                key={size}
                variants={filterOptionVariants}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSize(size)}
                className={`min-h-11 border text-[10px] transition-[background-color,border-color,color] ${
                  selected
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line hover:border-ink'
                }`}
              >
                {size}
              </motion.button>
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Color" count={selectedColors.length}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          {colors.map((color) => {
            const selected = selectedColors.includes(color.name)
            return (
              <motion.button
                key={color.name}
                variants={filterOptionVariants}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleColor(color.name)}
                className={`flex min-h-11 items-center gap-2.5 border px-3 text-left text-xs transition-colors ${selected ? 'border-ink bg-ink/[0.04]' : 'border-line hover:border-ink'}`}
              >
                <span
                  className={`grid size-4 shrink-0 place-items-center rounded-full border ${
                    selected ? 'border-ink ring-1 ring-ink ring-offset-2 ring-offset-canvas' : 'border-line'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {selected && (
                    <FiCheck
                      size={11}
                      className={color.name === 'Black' ? 'text-white' : 'text-black'}
                    />
                  )}
                </span>
                {color.name}
              </motion.button>
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Ratings" count={minRating === 0 ? 0 : 1}>
        <div className="space-y-1">
          {[0, 4, 4.5].map((rating) => (
            <FilterCheckbox
              key={rating}
              label={rating === 0 ? 'All ratings' : `${rating} stars & up`}
              checked={minRating === rating}
              onChange={() => setMinRating(rating)}
              radio
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability" count={availability === 'all' ? 0 : 1} last>
        <div className="space-y-1">
          {[
            ['all', 'All products'],
            ['in-stock', 'In stock'],
            ['out-of-stock', 'Out of stock'],
          ].map(([value, label]) => (
            <FilterCheckbox
              key={value}
              label={label}
              checked={availability === value}
              onChange={() =>
                setAvailability(value as 'all' | 'in-stock' | 'out-of-stock')
              }
              radio
            />
          ))}
        </div>
      </FilterGroup>
    </motion.div>
  )
}

function FilterGroup({
  title,
  children,
  count,
  initiallyOpen = false,
  last = false,
}: {
  title: string
  children: React.ReactNode
  count: number
  initiallyOpen?: boolean
  last?: boolean
}) {
  const [open, setOpen] = useState(initiallyOpen)

  return (
    <motion.section
      variants={filterGroupVariants}
      className={last ? '' : 'border-b border-line'}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em]">
          {title}
          {count > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-ink text-[8px] tracking-normal text-canvas">
              {count}
            </span>
          )}
        </span>
        <FiChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function FilterCheckbox({
  label,
  checked,
  onChange,
  radio = false,
}: {
  label: string
  checked: boolean
  onChange: () => void
  radio?: boolean
}) {
  return (
    <motion.label
      variants={filterOptionVariants}
      className={`group flex min-h-10 cursor-pointer items-center justify-between gap-3 border px-3 text-xs transition-colors ${checked ? 'border-ink bg-ink/[0.04]' : 'border-transparent hover:bg-ink/[0.03]'}`}
    >
      <input
        type={radio ? 'radio' : 'checkbox'}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span>{label}</span>
      <span
        className={`grid size-4 shrink-0 place-items-center border ${radio ? 'rounded-full' : ''} ${checked ? 'border-ink bg-ink text-canvas' : 'border-line'}`}
      >
        {checked && (radio ? <span className="size-1.5 rounded-full bg-canvas" /> : <FiCheck size={10} />)}
      </span>
    </motion.label>
  )
}
