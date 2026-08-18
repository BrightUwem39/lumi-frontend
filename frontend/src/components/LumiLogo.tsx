type LumiLogoProps = {
  compact?: boolean
}

export function LumiLogo({ compact = false }: LumiLogoProps) {
  return (
    <span className={`flex items-center ${compact ? 'gap-2' : 'gap-1 sm:gap-2.5'}`} aria-hidden="true">
      <svg
        viewBox="0 0 32 32"
        className={compact ? 'size-6 shrink-0' : 'size-4 shrink-0 sm:size-8'}
        fill="none"
      >
        <circle cx="16" cy="16" r="14.5" stroke="currentColor" />
        <path
          d="M10.25 8.75v14.5h11.5M15.5 8.75v9.25h6.25"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="square"
        />
        <circle cx="22" cy="9" r="1.35" fill="currentColor" />
      </svg>
      <span className={compact
        ? 'font-display text-[18px] leading-none tracking-[0.16em]'
        : 'font-display text-[12px] leading-none tracking-[0.11em] sm:text-[28px] sm:tracking-[0.18em] xl:text-[31px]'}
      >
        LUMI
      </span>
    </span>
  )
}
