import { useState, type ReactNode } from 'react'
import { Image as ImageIcon } from 'lucide-react'

interface Props {
  src: string
  alt: string
  className?: string
  icon?: ReactNode
  /** Affiché sous l'icône quand l'image est absente (ex. le nom de fichier attendu). */
  hint?: string
  /** "tile" : fond crème, pour les petites vignettes. "hero" : dégradé de marque, pour les grandes zones. */
  fallback?: 'tile' | 'hero'
}

/**
 * Affiche une image locale (public/images/…) et se rabat automatiquement sur un
 * emplacement illustré — icône + indice, dans les couleurs KOMERCE — si le fichier
 * est absent, au lieu de l'icône de lien cassé du navigateur.
 * L'indice (nom du fichier attendu) n'est affiché qu'en développement, jamais aux visiteurs.
 */
export default function SmartImage({ src, alt, className = '', icon, hint, fallback = 'tile' }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    const hero = fallback === 'hero'
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 ${hero ? 'bg-gradient-to-br from-brand-600 to-brand-900 text-white/60' : 'bg-gradient-to-br from-brand-50 to-brand-100 text-brand-400'} ${className}`}
      >
        {icon ?? <ImageIcon size={hero ? 40 : 26} />}
        {hint && import.meta.env.DEV && <span className={`px-3 text-center text-[11px] font-semibold ${hero ? 'text-white/45' : 'text-brand-500/60'}`}>{hint}</span>}
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
}
