/**
 * Lebanese-themed card back with repeating diamond pattern + cedar tree.
 * Used when a card is face-down. Scales to container (100% × 100%).
 */
export function CardBack() {
  return (
    <div className="w-full h-full relative" aria-hidden>
      {/* Base green with repeating diagonal stripe pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#006233',
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(0, 166, 81, 0.25) 4px,
              rgba(0, 166, 81, 0.25) 5px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 4px,
              rgba(0, 166, 81, 0.25) 4px,
              rgba(0, 166, 81, 0.25) 5px
            )
          `,
        }}
      />
      {/* Red accent stripes top & bottom */}
      <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ backgroundColor: '#CE1126' }} />
      <div className="absolute bottom-0 left-0 right-0 h-[4px]" style={{ backgroundColor: '#CE1126' }} />
      {/* Inner border */}
      <div
        className="absolute inset-[3px] rounded-[3px]"
        style={{ border: '1px solid rgba(0, 166, 81, 0.5)' }}
      />
      {/* Center cedar tree + "Mix Bitch" text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        <svg
          viewBox="0 0 40 50"
          className="w-[40%] h-auto opacity-80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 2 L8 36 h6 L13 46 h14l-1-10 h6 L20 2z"
            fill="#00A651"
          />
          <rect x="18" y="46" width="4" height="4" rx="0.5" fill="#00A651" />
        </svg>
        <span
          className="font-heading font-bold tracking-wider text-white/80 mt-[-2px]"
          style={{ fontSize: 'clamp(5px, 2vw, 9px)', letterSpacing: '0.12em' }}
        >
          MIX BITCH
        </span>
      </div>
    </div>
  )
}
