import { useEffect, useRef } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'

export type LottieName = 'hero'

// `staticFrame` : image affichée quand l'animation est figée (prefers-reduced-motion).
// Doit être une frame où la scène est entièrement composée et visible (opacité pleine),
// jamais la première (0) ni la dernière : ce sont les frames du fondu d'entrée/sortie,
// donc quasi transparentes — les figer là rendrait l'animation invisible.
const SOURCES: Record<LottieName, { path: string; staticFrame: number }> = {
  // Panier, boîtes, pièce, graphique de croissance et logo KOMERCE, en vert/or.
  hero: { path: '/lottie/komerce-hero.json', staticFrame: 120 },
}

interface Props {
  name?: LottieName
  className?: string
  loop?: boolean
  /** Vitesse de lecture (1 = normale). */
  speed?: number
}

/**
 * Joue une animation Lottie KOMERCE (vectorielle, légère, fond transparent),
 * via lottie-web directement (API impérative simple, sans wrapper React).
 * Respecte prefers-reduced-motion en figeant l'animation sur sa première image.
 */
export default function LottieAnimation({ name = 'hero', className, loop = true, speed = 1 }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const anim = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!host.current) return
    const source = SOURCES[name]
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const instance = lottie.loadAnimation({
      container: host.current,
      renderer: 'svg',
      loop,
      autoplay: !reduced,
      path: source.path,
      assetsPath: '/', // les images de l'animation (ex. logo-mark.png) sont servies depuis la racine
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    })
    instance.setSpeed(speed)
    if (reduced) instance.goToAndStop(source.staticFrame, true)
    anim.current = instance
    return () => instance.destroy()
  }, [name, loop, speed])

  return <div ref={host} className={className} aria-hidden />
}
