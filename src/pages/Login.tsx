import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, ArrowRight, BarChart3, ChevronRight, Eye, EyeOff, Loader2, Lock, Package,
  Phone, Rocket, ShieldCheck, ShoppingCart, TrendingUp, User, Users, Zap,
} from 'lucide-react'
import { useSession } from '../lib/session'
import { useToasts } from '../lib/toast'
import { signIn, signInWithGoogle, signUp } from '../lib/auth'
import { firebaseEnabled } from '../lib/firebase'
import SmartImage from '../components/SmartImage'

const delay = (s: number) => ({ '--d': `${s}s` }) as CSSProperties

/* ---------- Champ avec label flottant, focus animé et état d'erreur ---------- */
function Field({ icon, label, right, invalid, ...p }: { icon: ReactNode; label: string; right?: ReactNode; invalid?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false)
  const floated = focus || String(p.value ?? '').length > 0
  return (
    <label
      className={`relative flex h-[3.75rem] cursor-text items-center gap-3 rounded-2xl border px-4 transition-all duration-300 ${
        invalid
          ? 'border-red-400 bg-red-50/40 ring-4 ring-red-500/10'
          : focus
            ? 'border-brand-500 bg-white shadow-[0_10px_28px_-12px_rgb(11_122_66/0.55)] ring-4 ring-brand-500/15'
            : 'border-black/[0.07] bg-paper hover:border-black/20'
      }`}
    >
      <span className={`transition-all duration-300 ${focus ? '-rotate-6 scale-110 text-brand-600' : invalid ? 'text-red-500' : 'text-brand-600/70'}`}>{icon}</span>
      <span className="relative h-full min-w-0 flex-1">
        <span
          className={`pointer-events-none absolute left-0 origin-left transition-all duration-200 ease-out ${
            floated ? 'top-2 text-[11px] font-bold' : 'top-1/2 -translate-y-1/2 text-[15px] font-medium'
          } ${invalid ? 'text-red-500' : focus ? 'text-brand-600' : 'text-black/45'}`}
        >
          {label}
        </span>
        <input
          {...p}
          onFocus={(e) => {
            setFocus(true)
            p.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocus(false)
            p.onBlur?.(e)
          }}
          aria-invalid={invalid || undefined}
          className={`absolute inset-x-0 bottom-1.5 bg-transparent text-[15px] font-semibold transition-opacity duration-200 placeholder:text-black/30 ${floated ? '' : 'placeholder:opacity-0'}`}
        />
      </span>
      {right}
    </label>
  )
}

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

const badges = [
  { icon: ShoppingCart, label: 'Gérez vos produits' },
  { icon: TrendingUp, label: 'Suivez vos ventes' },
  { icon: Users, label: 'Développez votre activité' },
]

const trust = [
  [ShieldCheck, 'Simple'],
  [Zap, 'Fiable'],
  [Rocket, 'Performant'],
] as const

const showcase = [
  { src: '/images/produits.jpg', title: 'Gérez vos produits', icon: ShoppingCart },
  { src: '/images/ventes.jpg', title: 'Suivez vos ventes', icon: BarChart3 },
  { src: '/images/stock.jpg', title: 'Contrôlez votre stock', icon: Package },
]

/** Cercles décoratifs : mouvements très lents, sans effet sur la mise en page. */
function Shapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="float-a absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full border border-gold-400/40 will-change-transform" />
      <div className="float-b absolute -right-8 -top-8 h-[19rem] w-[19rem] rounded-full border border-white/10 will-change-transform" />
      <div className="float-b absolute -bottom-36 -left-28 h-[26rem] w-[26rem] rounded-full bg-brand-400/25 blur-3xl will-change-transform" />
      <div className="float-c absolute right-[12%] top-[46%] h-40 w-40 rounded-full bg-gradient-to-br from-white/[0.12] to-transparent blur-[2px] will-change-transform" />
      <div className="float-a absolute bottom-[14%] right-[-3rem] h-56 w-56 rounded-full bg-gold-400/10 blur-2xl will-change-transform" />
      <div className="float-c absolute left-[30%] top-[-4rem] h-24 w-24 rounded-full border border-white/10 will-change-transform" />
    </div>
  )
}

type Busy = null | 'form' | 'google' | 'success'
type Step = 'choose' | 'phone'

export default function Login() {
  const login = useSession((s) => s.login)
  const push = useToasts((s) => s.push)
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('choose')
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<Busy>(null)
  const [shaking, setShaking] = useState(false)
  const lastError = useRef('')
  if (error) lastError.current = error

  const fail = (message: string) => {
    setError(message)
    setShaking(false)
    requestAnimationFrame(() => {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    })
  }
  const clearError = () => error && setError('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy('form')
    const r = mode === 'up' ? await signUp({ name, phone, password }, remember) : await signIn({ phone, password }, remember)
    if (r.ok) {
      setBusy('success')
      await new Promise((res) => setTimeout(res, 550)) // laisse voir l'animation de succès
      login(r.name, r.id, remember)
    } else {
      setBusy(null)
      fail(r.error)
    }
  }

  const google = async () => {
    setError('')
    setBusy('google')
    const r = await signInWithGoogle(remember)
    if (r.ok) {
      setBusy('success')
      login(r.name, r.id, remember)
      navigate('/', { replace: true }) // tableau de bord KOMERCE
    } else {
      setBusy(null)
      if (r.error) fail(r.error)
    }
  }

  const flip = () => {
    setError('')
    setMode(mode === 'in' ? 'up' : 'in')
  }

  const backToChoice = () => {
    setError('')
    setStep('choose')
  }

  const loading = busy !== null
  const invalid = !!error
  const canSubmit = !!phone && !!password && (mode !== 'up' || !!name.trim())

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      {/* ---------- Bandeau compact (mobile et tablette) ---------- */}
      <header className="anim-fade relative overflow-hidden bg-gradient-to-br from-[#0d7a45] via-[#08502c] to-[#03281a] rounded-b-[2.5rem] px-6 pb-14 pt-9 text-center text-white lg:hidden">
        <Shapes />
        <img src="/logo-mark.png" alt="" className="anim-scale relative mx-auto h-16 w-16 object-contain drop-shadow-2xl" style={delay(0.15)} />
        <div className="anim-up relative mt-2 text-2xl font-black tracking-tight" style={delay(0.25)}>KOMERCE</div>
        <div className="anim-up relative mt-1 flex items-center justify-center gap-2 text-xs font-medium text-white/80" style={delay(0.32)}>
          <span className="h-0.5 w-6 bg-gold-400" /> Gérez. Vendez. Progressez. <span className="h-0.5 w-6 bg-gold-400" />
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[1fr_1.15fr]">
        {/* ---------- Panneau visuel (ordinateur) : photo du commerce ---------- */}
        <aside className="anim-left relative hidden overflow-hidden text-white lg:block lg:rounded-r-[3.5rem]">
          <SmartImage
            src="/images/hero-commerce.jpg"
            alt="Un commerce géré avec KOMERCE"
            className="absolute inset-0 h-full w-full object-cover"
            icon={<ShoppingCart size={48} />}
            hint="images/hero-commerce.jpg"
            fallback="hero"
          />
          {/* Superposition sombre : garde le texte lisible quelle que soit la photo */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/40" />

          <p className="anim-up absolute inset-x-10 bottom-12 text-4xl font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_4px_18px_rgba(0,0,0,0.5)] xl:inset-x-12 xl:text-5xl" style={delay(0.3)}>
            Gérez.<br />Vendez.<br />Progressez&nbsp;!
            <span className="mt-3 block h-1 w-16 rounded-full bg-gold-400" />
          </p>
        </aside>

        {/* ---------- Formulaire ---------- */}
        <main className="-mt-10 flex items-start justify-center px-4 pb-10 sm:px-8 lg:mt-0 lg:items-center lg:py-10">
          <div className="anim-right relative z-10 w-full max-w-md rounded-[2rem] border border-black/[0.05] bg-white p-6 shadow-[0_30px_80px_-28px_rgb(4_58_32/0.45)] sm:p-8 md:max-w-lg lg:max-w-md">
            {/* ================= Étape 1 : choix du mode de connexion ================= */}
            {step === 'choose' ? (
              <div key="choose">
                <div className="text-center">
                  <img src="/logo.png" alt="KOMERCE — Gérez. Vendez. Progressez." className="anim-scale mx-auto h-28 w-auto object-contain transition duration-300 hover:brightness-105" style={delay(0.15)} />
                  <h1 className="anim-up mt-3 text-2xl font-extrabold text-brand-700" style={delay(0.3)}>Bienvenue sur KOMERCE</h1>
                  <p className="anim-up mt-2 text-[15px] text-black/55" style={delay(0.38)}>La solution simple et puissante pour gérer votre commerce.</p>
                </div>

                <div className="mt-7 space-y-3">
                  <button
                    type="button"
                    onClick={google}
                    disabled={loading}
                    aria-busy={busy === 'google'}
                    className="anim-up group flex w-full cursor-pointer items-center gap-3 rounded-full border border-black/10 bg-white py-3.5 pl-5 pr-4 font-bold text-ink shadow-[0_1px_2px_rgb(10_31_22/0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_12px_26px_-14px_rgb(10_31_22/0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                    style={delay(0.46)}
                  >
                    <span className="flex h-5 w-5 items-center justify-center">
                      {busy === 'google' ? <Loader2 size={18} className="animate-spin text-brand-600" /> : <span className="transition-transform duration-300 group-hover:scale-110"><GoogleG /></span>}
                    </span>
                    <span className="flex-1 text-left">{busy === 'google' ? 'Connexion à Google…' : 'Continuer avec Google'}</span>
                    <ChevronRight size={18} className="shrink-0 text-black/30 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <div className="anim-fade flex items-center gap-4 text-sm text-black/40" style={delay(0.5)} aria-hidden>
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-black/10" /> ou <span className="h-px flex-1 bg-gradient-to-l from-transparent to-black/10" />
                  </div>

                  <button
                    type="button"
                    onClick={() => { setError(''); setStep('phone') }}
                    disabled={loading}
                    className="anim-up group flex w-full cursor-pointer items-center gap-3 rounded-full bg-gradient-to-b from-brand-500 to-brand-700 py-3.5 pl-5 pr-4 font-bold text-white shadow-[0_14px_28px_-12px_rgb(11_122_66/0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-12px_rgb(11_122_66/0.75)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35 active:translate-y-0 active:scale-[0.98]"
                    style={delay(0.56)}
                  >
                    <span className="flex h-5 w-5 items-center justify-center"><Phone size={19} /></span>
                    <span className="flex-1 text-left">Se connecter avec un numéro de téléphone</span>
                    <ChevronRight size={18} className="shrink-0 text-white/70 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>

                {/* Erreur de connexion Google : message simple (l'erreur technique complète est dans la console) */}
                <div className={`grid transition-all duration-300 ease-out ${error ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} role="alert" aria-live="polite">
                  <div className="overflow-hidden">
                    <p className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">
                      <AlertCircle size={17} className="mt-0.5 shrink-0" /> {error || lastError.current}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-2.5">
                  {badges.map(({ icon: Icon, label }, i) => (
                    <div key={label} className="anim-up flex flex-col items-center gap-1.5 rounded-2xl bg-brand-50 px-2 py-3.5 text-center" style={delay(0.66 + i * 0.08)}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Icon size={17} /></span>
                      <span className="text-[11px] font-bold leading-tight text-brand-700">{label}</span>
                    </div>
                  ))}
                </div>

                <p className="anim-fade mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-black/40" style={delay(0.95)}>
                  <ShieldCheck size={14} /> {firebaseEnabled ? 'Vos données sont sécurisées et synchronisées' : 'Vos données restent sur cet appareil'}
                </p>
              </div>
            ) : (
              /* ================= Étape 2 : connexion par téléphone ================= */
              <form key="phone" onSubmit={submit} noValidate>
                <button type="button" onClick={backToChoice} className="anim-up mb-4 flex cursor-pointer items-center gap-1.5 rounded-lg text-sm font-bold text-black/50 transition hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
                  <ArrowLeft size={16} /> Retour
                </button>

                <div className="text-center">
                  <p className="anim-up text-lg font-extrabold sm:text-xl" style={delay(0.05)}>
                    {mode === 'in' ? 'Bon retour !' : 'Créer votre compte'}
                  </p>
                  <p className="anim-up mt-2 text-[15px] text-black/55" style={delay(0.1)}>
                    {mode === 'in' ? 'Connectez-vous avec votre numéro de téléphone' : 'Quelques secondes suffisent pour démarrer'}
                  </p>
                </div>

                <div className={`mt-6 space-y-3 ${shaking ? 'shake' : ''}`}>
                  {mode === 'up' && (
                    <div className="anim-up">
                      <Field icon={<User size={20} />} label="Votre nom" value={name} onChange={(e) => { setName(e.target.value); clearError() }} placeholder="Ex : Aïcha Koné" autoComplete="name" invalid={invalid && !name.trim()} />
                    </div>
                  )}
                  <div className="anim-up" style={delay(0.16)}>
                    <Field icon={<Phone size={20} />} label="Numéro de téléphone" type="tel" inputMode="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clearError() }} placeholder="Ex : 0700000000" autoComplete="tel" invalid={invalid} />
                  </div>
                  <div className="anim-up" style={delay(0.22)}>
                    <Field
                      icon={<Lock size={20} />}
                      label="Mot de passe"
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearError() }}
                      placeholder={mode === 'up' ? '6 caractères minimum' : '••••••••'}
                      autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
                      invalid={invalid}
                      right={
                        <button
                          type="button"
                          onClick={() => setShow((v) => !v)}
                          aria-pressed={show}
                          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          className="relative h-9 w-9 shrink-0 cursor-pointer rounded-xl text-black/40 transition duration-200 hover:bg-black/5 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 active:scale-90"
                        >
                          <Eye size={20} className={`absolute inset-0 m-auto transition-all duration-300 ${show ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
                          <EyeOff size={20} className={`absolute inset-0 m-auto transition-all duration-300 ${show ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
                        </button>
                      }
                    />
                  </div>
                </div>

                {/* Message d'erreur : ouverture douce + fondu */}
                <div className={`grid transition-all duration-300 ease-out ${error ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} role="alert" aria-live="polite">
                  <div className="overflow-hidden">
                    <p className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">
                      <AlertCircle size={17} className="mt-0.5 shrink-0" /> {error || lastError.current}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                  <label className="group flex cursor-pointer select-none items-center gap-2.5 font-medium">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
                    <span className="flex h-5 w-5 items-center justify-center rounded-md border border-black/25 bg-white transition-all duration-200 group-active:scale-90 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/30 group-hover:border-brand-500">
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M3 8.5l3.2 3.2L13 4.8" style={{ strokeDasharray: 24, strokeDashoffset: remember ? 0 : 24, transition: 'stroke-dashoffset 0.25s ease' }} />
                      </svg>
                    </span>
                    Se souvenir de moi
                  </label>
                  {mode === 'in' && (
                    <button type="button" onClick={() => push('Réinitialisation par SMS bientôt disponible', 'warn')} className="link-u cursor-pointer rounded font-semibold text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>

                {/* Bouton principal */}
                <button
                  disabled={loading || !canSubmit}
                  aria-busy={loading}
                  className={`shine group relative mt-5 flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-base font-extrabold text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35 focus-visible:ring-offset-2 ${
                    busy === 'success'
                      ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_16px_32px_-12px_rgb(5_150_105/0.7)]'
                      : 'bg-gradient-to-b from-brand-500 to-brand-700 shadow-[0_14px_28px_-12px_rgb(11_122_66/0.65)] enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_20px_36px_-12px_rgb(11_122_66/0.75)] enabled:active:translate-y-0 enabled:active:scale-[0.98]'
                  } ${loading ? 'cursor-wait' : ''} disabled:cursor-not-allowed ${loading ? '' : 'disabled:from-black/20 disabled:to-black/25 disabled:shadow-none'}`}
                >
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
                    {busy === 'form' ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : busy === 'success' ? (
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                        <path d="M3 8.5l3.2 3.2L13 4.8" className="draw-check" />
                      </svg>
                    ) : (
                      <ArrowRight size={18} className="transition-transform duration-300 group-enabled:group-hover:translate-x-0.5" />
                    )}
                  </span>
                  <span>{busy === 'form' ? (mode === 'in' ? 'Connexion…' : 'Création…') : busy === 'success' ? 'Connecté !' : mode === 'in' ? 'Se connecter' : 'Créer mon compte'}</span>
                </button>

                <p className="mt-5 text-center text-sm text-black/60">
                  {mode === 'in' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                  <button type="button" onClick={flip} className="link-u cursor-pointer rounded font-extrabold text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
                    {mode === 'in' ? 'Créer un compte' : 'Se connecter'}
                  </button>
                </p>

                <div className="group mt-5 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-3.5 transition duration-300 hover:border-brand-200">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition duration-300 group-hover:scale-105"><ShieldCheck size={22} /></span>
                  <div className="flex-1 text-sm">
                    <div className="font-extrabold text-brand-700">Vos données sont sécurisées</div>
                    <div className="text-xs text-black/50">{firebaseEnabled ? 'Synchronisées avec votre compte, sur tous vos appareils' : 'Enregistrées uniquement sur cet appareil'}</div>
                  </div>
                  <ChevronRight size={18} className="text-brand-600 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </form>
            )}
          </div>
        </main>
      </div>

      {/* ---------- Vitrine : trois images de l'application ---------- */}
      <div className="mx-auto mt-2 w-full max-w-5xl px-4 sm:px-8 lg:mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {showcase.map(({ src, title, icon: Icon }, i) => (
            <div
              key={title}
              className="anim-up group relative overflow-hidden rounded-3xl shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-16px_rgb(11_122_66/0.45)]"
              style={delay(0.1 + i * 0.1)}
            >
              <SmartImage
                src={src}
                alt={title}
                className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.06] sm:h-48"
                icon={<Icon size={26} />}
                hint={src.replace('/', '')}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-brand-900 shadow-md transition-transform duration-300 group-hover:scale-110">
                  <Icon size={17} />
                </span>
                <span className="text-sm font-extrabold uppercase tracking-wide text-white drop-shadow-sm">{title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Bandeau bas incurvé : citation + points forts ---------- */}
      <footer className="anim-fade relative mt-2 overflow-hidden rounded-t-[2.5rem] bg-gradient-to-r from-[#08502c] to-[#0d7a45] px-6 py-7 text-white sm:px-10 lg:mt-4 lg:rounded-t-[3.5rem] lg:px-16" style={delay(1.3)}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-gold-300 sm:flex">🌿</span>
            <p className="max-w-sm text-sm font-medium leading-snug text-white/90">
              Un commerce bien géré aujourd'hui, de plus grandes opportunités demain.
            </p>
          </div>
          <div className="flex items-center gap-5 sm:gap-8">
            {trust.map(([Icon, label], i) => (
              <div key={label} className="flex items-center gap-5 sm:gap-8">
                <div className="flex flex-col items-center gap-1.5">
                  <Icon size={22} className="text-gold-300" />
                  <span className="text-xs font-bold">{label}</span>
                </div>
                {i < trust.length - 1 && <span className="hidden h-8 w-px bg-white/20 sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
