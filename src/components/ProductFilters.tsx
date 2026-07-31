import { FiCheck, FiSliders } from 'react-icons/fi'

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
}

const priceOptions: { label: string; value: PriceFilter }[] = [
  { label: 'All prices', value: 'all' },
  { label: '$10 – $50', value: '10-50' },
  { label: '$50 – $150', value: '50-150' },
  { label: '$150 – $250', value: '150-250' },
  { label: '$250+', value: 'over-250' },
]

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
}: ProductFilterProps) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h2 className="flex items-center gap-2 text-sm">
          <FiSliders size={15} />
          Filters
        </h2>
        <button
          type="button"
          onClick={resetFilters}
          className="text-[9px] font-medium uppercase tracking-[0.15em] text-ink/50 transition-colors hover:text-ink"
        >
          Reset all
        </button>
      </div>

      <FilterGroup title="Category">
        <div className="space-y-3">
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

      <FilterGroup title="Price">
        <div className="space-y-3">
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

      <FilterGroup title="Size">
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((size) => {
            const selected = selectedSizes.includes(size)
            return (
              <button
                key={size}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSize(size)}
                className={`min-h-10 border text-[10px] transition-colors ${
                  selected
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line hover:border-ink'
                }`}
              >
                {size}
              </button>
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Color">
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          {colors.map((color) => {
            const selected = selectedColors.includes(color.name)
            return (
              <button
                key={color.name}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleColor(color.name)}
                className="flex items-center gap-2.5 text-left text-xs"
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border ${
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
              </button>
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Ratings">
        <div className="space-y-3">
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

      <FilterGroup title="Availability" last>
        <div className="space-y-3">
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
    </div>
  )
}

function FilterGroup({
  title,
  children,
  last = false,
}: {
  title: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <fieldset className={`${last ? '' : 'border-b border-line'} py-5`}>
      <legend className="mb-4 text-[9px] font-medium uppercase tracking-[0.18em]">
        {title}
      </legend>
      {children}
    </fieldset>
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
    <label className="flex cursor-pointer items-center gap-3 text-xs">
      <input
        type={radio ? 'radio' : 'checkbox'}
        checked={checked}
        onChange={onChange}
        className="size-3.5 accent-current"
      />
      {label}
    </label>
  )
}
