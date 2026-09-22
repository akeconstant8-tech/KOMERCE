import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Home as HomeIcon, Package, ShoppingCart, Users } from 'lucide-react'
import { Toasts } from './components/ui'
import { Sidebar, Topbar } from './components/Shell'
import { useTheme } from './lib/theme'
import { useSession } from './lib/session'
import { auth, firebaseEnabled } from './lib/firebase'
import { startSync } from './lib/sync'
import Login from './pages/Login'
import Home from './pages/Home'
import Pos from './pages/Pos'
import Stock from './pages/Stock'
import Customers from './pages/Customers'
import Analytics from './pages/Analytics'
import Assistant from './pages/Assistant'
import Orders from './pages/Orders'
import Suppliers from './pages/Suppliers'
import SettingsPage from './pages/Settings'

const tabs = [
  { to: '/', label: 'Accueil', icon: HomeIcon },
  { to: '/stock', label: 'Stock', icon: Package },
  { to: '/caisse', label: 'Caisse', icon: ShoppingCart, main: true },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/analyse', label: 'Analyse', icon: BarChart3 },
]

export default function App() {
  const { pathname } = useLocation()
  const dark = useTheme((s) => s.dark)
  const user = useSession((s) => s.user)
  const uid = useSession((s) => s.accountId)
  const [authReady, setAuthReady] = useState(!firebaseEnabled)
  const [dataReady, setDataReady] = useState(!firebaseEnabled)

  // Firebase : l'état de connexion vient de Firebase (il survit aux rechargements et aux onglets).
  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (u) => {
      const s = useSession.getState()
      if (u) s.login(u.displayName || s.user || 'Utilisateur', u.uid)
      else s.logout()
      setAuthReady(true)
    })
  }, [])

  // Firebase : charge et synchronise les données du compte connecté.
  useEffect(() => {
    if (!firebaseEnabled || !uid) return
    setDataReady(false)
    const stop = startSync(uid, () => setDataReady(true))
    const timeout = setTimeout(() => setDataReady(true), 8000)
    return () => {
      clearTimeout(timeout)
      stop()
    }
  }, [uid])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  if (!authReady || (user && !dataReady))
    return (
      <div className="anim-fade flex min-h-dvh flex-col items-center justify-center gap-5">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          <img src="/logo-mark.png" alt="" className="anim-scale h-14 w-14 object-contain" />
        </div>
        <p className="anim-up text-sm font-semibold text-black/50" style={{ '--d': '0.15s' } as React.CSSProperties}>
          {user ? 'Chargement de vos données…' : 'Chargement…'}
        </p>
      </div>
    )

  if (!user)
    return (
      <div className="min-h-full">
        <Toasts />
        <Login />
      </div>
    )

  return (
    <div className="min-h-full">
      <Toasts />
      <Sidebar />
      <div className="mx-auto max-w-md px-4 pb-32 pt-5 lg:ml-[16.5rem] lg:max-w-none lg:px-6 lg:pb-8 lg:pt-4">
        <Topbar />
        <div className="mx-auto max-w-[1400px]">
          <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={pathname === '/' || pathname === '/commandes' ? '' : 'lg:max-w-3xl'}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/caisse" element={<Pos />} />
              <Route path="/commandes" element={<Orders />} />
              <Route path="/clients" element={<Customers />} />
              <Route path="/fournisseurs" element={<Suppliers />} />
              <Route path="/analyse" element={<Analytics />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/parametres" element={<SettingsPage />} />
            </Routes>
          </motion.div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-[26rem] items-end justify-between rounded-[1.75rem] bg-white/85 px-2 pb-2 pt-2 shadow-[0_20px_50px_-10px_rgb(10_31_22/0.3)] ring-1 ring-black/5 backdrop-blur-xl lg:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(({ to, label, icon: Icon, main }) =>
          main ? (
            <NavLink key={to} to={to} className="-mt-9 flex flex-col items-center">
              {({ isActive }) => (
                <>
                  <motion.span whileTap={{ scale: 0.9 }} className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow ring-4 ring-paper ${isActive ? 'scale-105' : ''}`}>
                    <Icon size={26} />
                  </motion.span>
                  <span className="mt-1 text-[11px] font-bold text-brand-700">{label}</span>
                </>
              )}
            </NavLink>
          ) : (
            <NavLink key={to} to={to} end={to === '/'} className="relative flex w-16 flex-col items-center gap-0.5 py-1.5">
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="tab" className="absolute inset-0 rounded-2xl bg-brand-50" transition={{ type: 'spring', damping: 28, stiffness: 350 }} />}
                  <Icon size={21} className={`relative ${isActive ? 'text-brand-700' : 'text-black/35'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`relative text-[10.5px] font-bold ${isActive ? 'text-brand-700' : 'text-black/35'}`}>{label}</span>
                </>
              )}
            </NavLink>
          ),
        )}
      </nav>
    </div>
  )
}
