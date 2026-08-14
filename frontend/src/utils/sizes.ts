// Shared size ranges keep the shop filters and product detail selector consistent.
export const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42']
export const SHOP_SIZE_OPTIONS = [...APPAREL_SIZES, ...SHOE_SIZES]

// Product controls must only offer sizes the catalogue says are available.
export const getExpandedSizes = (sizes: string[]) => {
  return Array.from(new Set(sizes.map((size) => size.trim()).filter(Boolean)))
}
