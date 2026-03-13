import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Returns true when viewport width is < MOBILE_BREAKPOINT (mobile stacked layout).
 */
export function useMediaQuery(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handle = () => setIsMobile(mql.matches)
    handle()
    mql.addEventListener('change', handle)
    return () => mql.removeEventListener('change', handle)
  }, [])

  return isMobile
}
