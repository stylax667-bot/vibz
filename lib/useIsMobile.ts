import { useEffect, useState } from 'react'

// Point de rupture mobile/tablette — aligné sur les media queries de globals.css
export const MOBILE_BREAKPOINT = 768

// true quand la fenêtre fait au plus `breakpoint` px de large.
// Côté client la valeur est juste dès le premier rendu (pas de « flash » ordinateur) ;
// côté serveur elle vaut false. Les composants qui l'utilisent ne sont rendus
// qu'après la vérification de session, donc uniquement côté client.
export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])

  return isMobile
}
