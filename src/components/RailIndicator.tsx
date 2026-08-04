// A quiet progress mark signals horizontal content without instructional copy.
export function RailIndicator({
  count,
  activeIndex,
}: {
  count: number
  activeIndex: number
}) {
  if (count < 2) return null

  return (
    <div className="mt-3 flex h-3 items-center justify-center gap-1.5 sm:hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={`h-0.5 transition-all duration-300 ${
            index === activeIndex ? 'w-6 bg-ink' : 'w-2 bg-ink/20'
          }`}
        />
      ))}
    </div>
  )
}
