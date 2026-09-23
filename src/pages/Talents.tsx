import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Banknote, Car, Coffee, GraduationCap, Scissors, ShieldCheck, Shirt, Smartphone, TrendingUp, Truck, Users,
  Utensils, Wifi, Wrench, ChevronRight,
} from 'lucide-react'
import { useToasts } from '../lib/toast'
import { Reveal } from '../components/ui'

const professions = [
  { img: '/images/couturiere.jpeg', icon: Scissors, title: 'Couturière', sub: 'Création sur mesure' },
  { img: '/images/vendeur.jpeg', icon: Shirt, title: 'Vendeur de vêtements', sub: 'Mode pour tous' },
  { img: '/images/degue.jpeg', icon: Coffee, title: 'Vendeuse de dégué', sub: 'Saveurs du marché' },
  { img: '/images/yango.jpeg', icon: Car, title: 'Chauffeur taxi Yango', sub: 'Votre trajet, notre priorité' },
  { img: '/images/decence.jpeg', icon: Shirt, title: 'Vente de vêtements', sub: 'Prêt-à-porter' },
  { img: '/images/logistique.jpeg', icon: Truck, title: 'Livraison & Logistique', sub: 'Rapide et sécurisée' },
  { img: '/images/restaurant.jpeg', icon: Utensils, title: 'Restauration', sub: "Saveurs d'ici" },
  { img: '/images/plombier.jpeg', icon: Wrench, title: 'Artisanat & Services', sub: 'Un savoir-faire, une valeur' },
]

const reasons = [
  { icon: Smartphone, title: 'Sur tous les téléphones', sub: 'Fonctionne même sur un appareil simple' },
  { icon: Wifi, title: 'Marche hors connexion', sub: 'Vos données se synchronisent au retour du réseau' },
  { icon: GraduationCap, title: "Aucune formation requise", sub: 'Pensé pour être compris en quelques minutes' },
  { icon: Banknote, title: 'Un tarif accessible', sub: 'Pour les petits commerces comme les grands' },
]

const trust = [
  { icon: Users, label: 'Accessible à tous' },
  { icon: ShieldCheck, label: "Simple d'utilisation" },
  { icon: Smartphone, label: 'Sur tous les appareils' },
  { icon: GraduationCap, label: 'Sans connaissances techniques' },
  { icon: TrendingUp, label: 'Un tarif pour tous les budgets' },
]

export default function Talents() {
  const push = useToasts((s) => s.push)
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <Reveal className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-center text-white shadow-card sm:p-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gold-300">Pour tous les commerces</p>
        <h1 className="mx-auto mt-2 max-w-2xl text-2xl font-extrabold leading-tight sm:text-4xl">KOMERCE est accessible à tous</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
          Couturière, chauffeur, restauratrice, plombier, vendeur… quel que soit votre métier, KOMERCE s'adapte à votre activité.
        </p>
      </Reveal>

      {/* Métiers */}
      <Reveal i={1}>
        <h2 className="mb-3 text-center text-sm font-extrabold uppercase tracking-wider text-black/40">8 métiers, une seule application</h2>
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {professions.map(({ img, icon: Icon, title, sub }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl shadow-card ring-4 ring-white"
            >
              <img src={img} alt={title} className="h-40 w-full object-cover sm:h-48" loading="lazy" />
              <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl bg-brand-600/95 px-2.5 py-2 backdrop-blur-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white"><Icon size={14} /></span>
                <span className="min-w-0 leading-tight text-white">
                  <span className="block truncate text-[11.5px] font-extrabold">{title}</span>
                  <span className="block truncate text-[10px] text-white/75">{sub}</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* Vitrine centrale */}
      <Reveal i={2} className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl shadow-card">
          <img src="/images/homme.jpeg" alt="Commerçant gérant son activité au quotidien" className="h-64 w-full object-cover sm:h-80" />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 px-4 py-3 shadow-card backdrop-blur-sm">
            <p className="text-sm font-bold text-ink">« Je n'ai jamais utilisé un logiciel de gestion avant KOMERCE. »</p>
            <p className="mt-0.5 text-xs text-black/50">C'est exactement pour ça qu'elle a été pensée simple.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {reasons.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon size={20} /></span>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-ink">{title}</div>
                <div className="truncate text-xs text-black/50">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Bandeau bas */}
      <Reveal i={3} className="rounded-[2rem] bg-gradient-to-r from-brand-900 to-brand-600 p-5 text-white shadow-card sm:p-7">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {trust.map(({ icon: Icon, label }) => (
              <div key={label} className="flex w-20 flex-col items-center gap-1.5 text-center">
                <Icon size={20} className="text-gold-300" />
                <span className="text-[11px] font-bold leading-tight">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <button
              onClick={() => push('KOMERCE PRO arrive bientôt !')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-300 to-gold-400 px-6 py-3 text-sm font-extrabold text-brand-900 shadow-glow active:scale-95"
            >
              Rejoignez KOMERCE <ChevronRight size={16} />
            </button>
            <span className="text-xs font-semibold italic text-gold-300">Un commerce bien géré, accessible à tous&nbsp;!</span>
          </div>
        </div>
      </Reveal>

      <button onClick={() => navigate('/')} className="mx-auto block text-center text-xs font-semibold text-black/40 underline">
        Retour à l'accueil
      </button>
    </div>
  )
}
