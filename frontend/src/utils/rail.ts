// Finds the card nearest the horizontal viewport center after a drag or swipe.
export function getRailIndex(rail: HTMLElement) {
  const cards = Array.from(rail.children) as HTMLElement[]
  const railCenter = rail.scrollLeft + rail.clientWidth / 2

  return cards.reduce(
    (nearest, card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const distance = Math.abs(cardCenter - railCenter)
      return distance < nearest.distance ? { index, distance } : nearest
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  ).index
}
