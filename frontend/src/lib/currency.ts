const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number, currency = 'NGN') {
  const code = currency.toUpperCase()
  let formatter = formatters.get(code)
  if (!formatter) {
    formatter = new Intl.NumberFormat(code === 'NGN' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: code === 'NGN' ? 0 : 2,
    })
    formatters.set(code, formatter)
  }
  return formatter.format(amount)
}

export function commerceTerms(currency: string) {
  return currency.toUpperCase() === 'NGN'
    ? { shipping: 25_000, freeShippingThreshold: 345_000 }
    : { shipping: 18, freeShippingThreshold: 250 }
}
