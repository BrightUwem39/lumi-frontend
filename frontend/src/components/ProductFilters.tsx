import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  LuCheck as FiCheck,
  LuChevronDown as FiChevronDown,
  LuSlidersHorizontal as FiSliders,
} from 'react-icons/lu'

export type PriceFilter =
  | 'all'
  | 'under-200000'
  | '200000-300000'
  | '300000-400000'
  | 'over-400000'

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
  { label: 'Under ₦200,000', value: 'under-200000' },
  { label: '₦200,000 – ₦299,999', value: '200000-300000' },
  { label: '₦300,000 – ₦399,999', value: '300000-400000' },
  { label: '₦400,000+', value: 'over-400000' },
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
  const apparelSizes = sizes.filter((size) => !/^\d+$/.test(size))
  const shoeSizes = sizes.filter((size) => /^\d+$/.test(size))
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
        <div className="space-y-4">
          {[
            { label: 'Clothing', values: apparelSizes },
            { label: 'Shoes', values: shoeSizes },
          ].map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[8px] uppercase tracking-[0.14em] text-ink/40">
                {group.label}
              </p>
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${group.values.length}, minmax(0, 1fr))` }}
              >
                {group.values.map((size) => {
                  const selected = selectedSizes.includes(size)
                  return (
                    <motion.button
                      key={size}
                      variants={filterOptionVariants}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleSize(size)}
                      className={`min-h-10 min-w-0 border px-0.5 text-[9px] transition-[background-color,border-color,color] ${
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
            </div>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Color" count={selectedColors.length}>
        <div className="grid grid-cols-4 gap-1.5">
          {colors.map((color) => {
            const selected = selectedColors.includes(color.name)
            return (
              <motion.button
                key={color.name}
                variants={filterOptionVariants}
                type="button"
                aria-label={`Filter by ${color.name}`}
                aria-pressed={selected}
                onClick={() => toggleColor(color.name)}
                className={`flex min-h-11 min-w-0 items-center justify-center border transition-colors ${selected ? 'border-ink bg-ink/[0.04]' : 'border-line hover:border-ink'}`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border ${
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
