// Shared size ranges keep the shop filters and product detail selector consistent.
export const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42']
export const SHOP_SIZE_OPTIONS = [...APPAREL_SIZES, ...SHOE_SIZES]

// Catalogue APIs may return only a few sizes, so the storefront presents a complete range.
export const getExpandedSizes = (sizes: string[]) => {
  if (sizes.length === 1 && sizes[0].toLowerCase() === 'one size') return sizes

  const sizeRange = sizes.every((size) => /^\d+$/.test(size))
    ? SHOE_SIZES
    : APPAREL_SIZES

  return Array.from(new Set([...sizeRange, ...sizes]))
}
