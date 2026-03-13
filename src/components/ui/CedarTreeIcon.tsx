/**
 * Lebanese cedar (Cedrus libani) icon for "saved" / selected state.
 * Panel-guided: cedar = identity; use in selection boxes instead of gold highlight.
 */
interface CedarTreeIconProps {
  className?: string
  size?: number
  'aria-hidden'?: boolean
}

export function CedarTreeIcon({ className = '', size = 24, 'aria-hidden': ariaHidden }: CedarTreeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      {/* Lebanese cedar: triangle crown + trunk */}
      <path d="M12 3L4 18h5l-1 4h8l-1-4h5L12 3z" fill="currentColor" />
      <rect x="10.5" y="18" width="3" height="3" rx="0.5" fill="currentColor" />
    </svg>
  )
}
