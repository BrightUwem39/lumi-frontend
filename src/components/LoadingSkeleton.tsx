type SkeletonProps = {
  className?: string
}

// Every placeholder uses the same animated light sweep instead of a static block.
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton-shimmer ${className}`} />
}

type PageLoadingSkeletonProps = {
  variant: 'cart' | 'checkout' | 'wishlist'
}

// Page-specific arrangements preserve the final layout while catalog data resolves.
export function PageLoadingSkeleton({ variant }: PageLoadingSkeletonProps) {
  if (variant === 'wishlist') {
    return (
      <section
        role="status"
        aria-label="Loading saved products"
        className="mt-7 grid grid-cols-1 gap-x-3 gap-y-8 min-[340px]:grid-cols-2 sm:mt-8 sm:gap-x-4 lg:grid-cols-3 xl:grid-cols-4"
      >
        <span className="sr-only">Loading saved products…</span>
        {[0, 1, 2, 3].map((item) => (
          <div key={item}>
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="mt-4 h-3 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        ))}
      </section>
    )
  }

  if (variant === 'checkout') {
    return (
      <div
        role="status"
        aria-label="Loading checkout"
        className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-16"
      >
        <span className="sr-only">Loading checkout…</span>
        <div className="space-y-7">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-12 w-full" />
            ))}
          </div>
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-72 w-full xl:sticky xl:top-6" />
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-label="Loading shopping bag"
      className="mt-8 grid gap-12 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-20"
    >
      <span className="sr-only">Loading your bag…</span>
      <div className="space-y-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex gap-4 border-b border-line pb-5">
            <Skeleton className="aspect-[4/5] w-20 shrink-0 sm:w-24" />
            <div className="min-w-0 flex-1 py-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="mt-3 h-3 w-1/3" />
              <Skeleton className="mt-7 h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  )
}
