import { LogOut, Moon, RotateCcw } from 'lucide-react'
import { useSession } from '../lib/session'
import { signOutUser } from '../lib/auth'
import { useStore } from '../lib/store'
import { useTheme } from '../lib/theme'
import { useToasts } from '../lib/toast'
import { PageHeader } from '../components/ui'

export default function SettingsPage() {
  const { dark, toggle } = useTheme()
  const resetDemo = useStore((s) => s.resetDemo)
  const push = useToasts((s) => s.push)
  const { user, logout } = useSession()
  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Personnalisez votre espace" />
      <div className="divide-y divide-black/5 rounded-3xl bg-white shadow-card">
        <button onClick={toggle} className="flex w-full items-center gap-3 p-4 text-left">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Moon size={20} /></span>
          <div className="flex-1">
            <b>Mode sombre</b>
            <div className="text-xs text-black/50">Repose les yeux le soir</div>
          </div>
          <span className={`relative h-6 w-11 rounded-full transition ${dark ? 'bg-brand-500' : 'bg-black/15'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${dark ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
        <button
          onClick={() => {
            if (confirm('Remettre les données de démonstration ? Vos données actuelles seront perdues.')) {
              resetDemo()
              push('Données de démonstration restaurées')
            }
          }}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><RotateCcw size={20} /></span>
          <div className="flex-1">
            <b>Réinitialiser les données de démo</b>
            <div className="text-xs text-black/50">Recharge produits, ventes, clients et commandes d'exemple</div>
          </div>
        </button>
      </div>
      <button
        onClick={async () => {
          await signOutUser()
          logout()
          push('Vous êtes déconnecté')
        }}
        className="mt-4 flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-card"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"><LogOut size={20} /></span>
        <div className="flex-1">
          <b className="text-red-600">Se déconnecter</b>
          <div className="text-xs text-black/50">Connecté en tant que {user}</div>
        </div>
      </button>
      <p className="mt-6 text-center text-xs text-black/35">KOMERCE · version 0.2</p>
    </div>
  )
}
