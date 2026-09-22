import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ChevronDown, ClipboardList, Crown, Home, MessageCircle, Moon, Package, Search, Settings, ShoppingCart, Sparkles, Truck, Users, Wallet, Check, LogOut } from 'lucide-react'
import { useStore } from '../lib/store'
import { useTheme } from '../lib/theme'
import { useToasts } from '../lib/toast'
import { useSession } from '../lib/session'
import { signOutUser } from '../lib/auth'

function useLogout() {
  const logout = useSession((s) => s.logout)
  const push = useToasts((s) => s.push)
  return async () => {
    await signOutUser()
    logout()
    push('Vous êtes déconnecté')
  }
}

/** Logo complet (sidebar) ou emblème + nom (en-tête mobile). */
export function Logo({ full = false }: { full?: boolean }) {
  if (full) return <img src="/logo.png" alt="KOMERCE — Gérez. Vendez. Progressez." className="mx-auto h-24 w-auto object-contain" />
  return (
    <div className="flex items-center gap-2">
      <img src="/logo-mark.png" alt="" className="h-11 w-11 object-contain" />
      <span className="text-lg font-black tracking-[0.12em] text-brand-700">KOMERCE</span>
    </div>
  )
}

const links = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/stock', label: 'Produits', icon: Package },
  { to: '/caisse', label: 'Ventes', icon: ShoppingCart },
  { to: '/commandes', label: 'Commandes', icon: ClipboardList, badge: true },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/fournisseurs', label: 'Fournisseurs', icon: Truck },
  { to: '/analyse', label: 'Finances', icon: Wallet },
  { to: '/assistant', label: 'Assistant IA', icon: Sparkles },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
]

export function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} role="switch" aria-checked={on} className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-brand-500' : 'bg-white/25'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

export function Sidebar() {
  const pending = useStore((s) => s.sales.filter((x) => x.status === 'En cours').length)
  const { dark, toggle } = useTheme()
  const push = useToasts((s) => s.push)
  const logout = useLogout()
  return (
    <aside className="fixed inset-y-3 left-3 z-30 hidden w-[15.5rem] flex-col overflow-y-auto rounded-[2rem] bg-gradient-to-b from-[#0b6b3a] via-[#08502c] to-[#052e1b] p-4 text-white shadow-[0_30px_60px_-20px_rgb(4_58_32/0.7)] no-scrollbar lg:flex">
      <div className="mb-5 rounded-3xl bg-white px-3 py-3 shadow-lg ring-1 ring-white/20">
        <Logo full />
      </div>
      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={19} />
            <span className="flex-1">{label}</span>
            {badge && pending > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-extrabold">{pending}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-3xl bg-white/[0.08] p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <Crown size={26} className="text-gold-400" />
          <div className="leading-tight">
            <div className="font-black tracking-wide">KOMERCE PRO</div>
            <div className="text-[10px] text-white/60">Débloquez tout le potentiel de votre business !</div>
          </div>
        </div>
        <ul className="my-3 space-y-1.5 text-[11.5px] text-white/85">
          {['Rapports avancés', 'Gestion multi-boutiques', 'Support prioritaire', 'Sauvegarde automatique'].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/90 text-[#052e1b]"><Check size={11} strokeWidth={3} /></span>
              {f}
            </li>
          ))}
        </ul>
        <button onClick={() => push('KOMERCE PRO arrive bientôt !')} className="w-full rounded-xl bg-white py-2 text-sm font-extrabold text-brand-700 active:scale-95">
          Passer au Pro →
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/[0.08] px-4 py-3 ring-1 ring-white/10">
        <span className="flex items-center gap-2 text-sm font-semibold"><Moon size={17} /> Mode sombre</span>
        <Switch on={dark} onChange={toggle} />
      </div>

      <button onClick={logout} className="mt-3 flex items-center gap-3 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100 ring-1 ring-red-300/20 transition hover:bg-red-500/30 active:scale-[0.98]">
        <LogOut size={18} /> Déconnexion
      </button>
    </aside>
  )
}

export function Topbar() {
  const navigate = useNavigate()
  const { products, sales } = useStore()
  const alerts = products.filter((p) => p.qty <= p.alertThreshold).length + sales.filter((s) => s.status === 'En cours').length
  const [q, setQ] = useState('')
  const [notif, setNotif] = useState(false)
  const [menu, setMenu] = useState(false)
  const user = useSession((s) => s.user) ?? 'Utilisateur'
  const logout = useLogout()
  const input = useRef<HTMLInputElement>(null)
  const low = products.filter((p) => p.qty <= p.alertThreshold)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <header className="mb-5 flex items-center gap-3">
      <div className="lg:hidden">
        <Logo />
      </div>
      <form
        className="relative hidden flex-1 lg:block"
        onSubmit={(e) => {
          e.preventDefault()
          navigate(`/stock?q=${encodeURIComponent(q)}`)
          input.current?.blur()
        }}
      >
        <Search size={18} className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-brand-600" />
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full rounded-2xl border border-transparent bg-white/80 py-3.5 pl-11 pr-16 text-sm font-medium shadow-card backdrop-blur transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-600">Ctrl K</kbd>
      </form>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="relative">
          <button onClick={() => setNotif((v) => !v)} className="relative rounded-2xl bg-white p-3 shadow-card" aria-label="Notifications">
            <Bell size={20} className="text-brand-600" />
            {alerts > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">{alerts}</span>}
          </button>
          {notif && (
            <div className="absolute right-0 top-14 z-50 w-72 rounded-3xl bg-white p-3 shadow-[0_20px_50px_-10px_rgb(10_31_22/0.35)] ring-1 ring-black/5" onClick={() => setNotif(false)}>
              <div className="px-2 pb-2 text-xs font-extrabold uppercase tracking-wider text-black/40">Notifications</div>
              {low.map((p) => (
                <button key={p.id} onClick={() => navigate('/stock')} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-black/[0.03]">
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-sm"><b>{p.name}</b> — stock faible ({p.qty})</span>
                </button>
              ))}
              {sales.filter((s) => s.status === 'En cours').length > 0 && (
                <button onClick={() => navigate('/commandes')} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-black/[0.03]">
                  <span className="text-xl">📋</span>
                  <span className="text-sm"><b>{sales.filter((s) => s.status === 'En cours').length}</b> commandes en cours</span>
                </button>
              )}
              {alerts === 0 && <p className="px-2 py-3 text-sm text-black/45">Tout est en ordre 🎉</p>}
            </div>
          )}
        </div>
        <button onClick={() => navigate('/assistant')} className="relative hidden rounded-2xl bg-white p-3 shadow-card sm:block" aria-label="Assistant">
          <MessageCircle size={20} className="text-brand-600" />
        </button>
        <div className="relative hidden md:block">
          <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-3 rounded-2xl bg-white py-2 pl-2 pr-3 text-left shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-extrabold uppercase text-white">{user.charAt(0)}</span>
            <div className="max-w-[9rem] text-xs leading-tight">
              <div className="text-black/50">Bonjour,</div>
              <div className="truncate text-sm font-extrabold">{user}</div>
              <div className="text-[11px] text-black/45">Administrateur</div>
            </div>
            <ChevronDown size={16} className={`text-black/40 transition ${menu ? 'rotate-180' : ''}`} />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-[4.25rem] z-50 w-56 rounded-3xl bg-white p-2 shadow-[0_20px_50px_-10px_rgb(10_31_22/0.35)] ring-1 ring-black/5">
                <button onClick={() => { setMenu(false); navigate('/parametres') }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold hover:bg-black/[0.03]">
                  <Settings size={18} className="text-black/50" /> Paramètres
                </button>
                <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
                  <LogOut size={18} /> Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
        <button onClick={logout} className="rounded-2xl bg-white p-3 text-red-500 shadow-card md:hidden" aria-label="Se déconnecter">
          <LogOut size={20} />
        </button>
        <div className="hidden items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-card xl:flex">
          <CalendarDays size={18} className="text-brand-600" />
          <span className="capitalize">{date}</span>
        </div>
      </div>
    </header>
  )
}
