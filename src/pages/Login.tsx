import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AlertCircle, ArrowRight, BarChart3, ChevronRight, Eye, EyeOff, Globe, Laptop, Loader2, Lock, Package, Phone, ShieldCheck, ShoppingCart, User, Users, Zap } from 'lucide-react'
import { useSession } from '../lib/session'
import { useToasts } from '../lib/toast'
import { signIn, signInWithGoogle, signUp } from '../lib/auth'
import { firebaseEnabled } from '../lib/firebase'

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

const features = [
  { icon: ShoppingCart, title: 'Gestion des ventes', sub: 'Suivez et augmentez vos revenus' },
  { icon: Package, title: 'Gestion des produits', sub: 'Organisez votre catalogue' },
  { icon: BarChart3, title: 'Statistiques détaillées', sub: 'Des rapports clairs et précis' },
  { icon: Users, title: 'Clients et fournisseurs', sub: 'Centralisez vos relations' },
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

export default function Login() {
  const login = useSession((s) => s.login)
  const push = useToasts((s) => s.push)
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
    } else {
      setBusy(null)
      if (r.error) fail(r.error)
    }
  }

  const flip = () => {
    setError('')
    setMode(mode === 'in' ? 'up' : 'in')
  }

  const loading = busy !== null
  const invalid = !!error
  const canSubmit = !!phone && !!password && (mode !== 'up' || !!name.trim())

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      {/* ---------- Bandeau compact (mobile et tablette) ---------- */}
      <header className="anim-fade relative overflow-hidden bg-gradient-to-br from-[#0d7a45] via-[#08502c] to-[#03281a] rounded-b-[2.5rem] px-6 pb-20 pt-9 text-center text-white lg:hidden">
        <Shapes />
        <img src="/logo-mark.png" alt="" className="anim-scale relative mx-auto h-16 w-16 object-contain drop-shadow-2xl" style={delay(0.15)} />
        <div className="anim-up relative mt-2 text-2xl font-black tracking-tight" style={delay(0.25)}>KOMERCE</div>
        <div className="anim-up relative mt-1 flex items-center justify-center gap-2 text-xs font-medium text-white/80" style={delay(0.32)}>
          <span className="h-0.5 w-6 bg-gold-400" /> Gérez. Vendez. Progressez. <span className="h-0.5 w-6 bg-gold-400" />
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
        {/* ---------- Panneau de présentation (ordinateur) ---------- */}
        <aside className="anim-left relative hidden overflow-hidden bg-gradient-to-br from-[#0d7a45] via-[#08502c] to-[#03281a] p-10 text-white lg:flex lg:flex-col lg:rounded-r-[4.5rem] xl:p-14">
          <Shapes />
          <img src="/logo-mark.png" alt="" aria-hidden className="float-c pointer-events-none absolute -bottom-10 -right-10 h-96 w-96 object-contain opacity-[0.06]" />

          <div className="relative">
            <div className="flex items-center gap-4">
              <img src="/logo-mark.png" alt="" className="anim-scale h-20 w-20 object-contain drop-shadow-2xl transition duration-300 hover:brightness-110" style={delay(0.25)} />
              <div className="anim-up" style={delay(0.35)}>
                <div className="text-4xl font-black tracking-tight xl:text-5xl">KOMERCE</div>
                <div className="mt-1 flex items-center gap-3 text-sm font-medium text-white/80">
                  <span className="h-0.5 w-8 bg-gold-400" /> Gérez. Vendez. Progressez.
                </div>
              </div>
            </div>

            <h2 className="anim-up mt-12 max-w-md text-[2.3rem] font-extrabold leading-[1.1] tracking-tight xl:mt-14 xl:text-[2.6rem]" style={delay(0.45)}>
              La solution complète pour gérer votre <span className="text-gold-300">commerce</span>
            </h2>
            <p className="anim-up mt-4 max-w-sm text-white/75" style={delay(0.55)}>Des outils simples et puissants pour développer votre activité au quotidien.</p>

            <ul className="mt-8 space-y-3">
              {features.map(({ icon: Icon, title, sub }, i) => (
                <li
                  key={title}
                  className="anim-up group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                  style={delay(0.7 + i * 0.13)}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 transition duration-300 group-hover:scale-105 group-hover:bg-white/15">
                    <Icon size={21} />
                  </span>
                  <div>
                    <div className="font-bold">{title}</div>
                    <div className="text-sm text-white/60">{sub}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <blockquote className="anim-up relative mt-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur" style={delay(1.3)}>
            <div className="flex gap-3">
              <span className="text-5xl font-black leading-none text-gold-400">“</span>
              <div>
                <p className="text-lg font-medium leading-snug">Un commerce bien géré aujourd'hui, un grand avenir demain.</p>
                <span className="mt-3 block h-0.5 w-10 bg-gold-400" />
              </div>
            </div>
          </blockquote>
        </aside>

        {/* ---------- Formulaire ---------- */}
        <main className="-mt-12 flex items-start justify-center px-4 pb-10 sm:px-8 lg:mt-0 lg:items-center lg:py-10">
          <form
            onSubmit={submit}
            noValidate
            className="anim-right relative z-10 w-full max-w-md rounded-[2rem] border border-black/[0.05] bg-white p-6 shadow-[0_30px_80px_-28px_rgb(4_58_32/0.45)] sm:p-8 md:max-w-lg lg:max-w-md"
          >
            <div className="absolute right-5 top-5 hidden items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-black/70 transition duration-200 hover:border-black/20 hover:bg-black/[0.02] lg:flex">
              <Globe size={16} className="text-black/50" /> Français
            </div>

            <div className="text-center lg:pt-9">
              <p className="anim-up text-lg font-extrabold sm:text-xl" style={delay(0.2)}>
                {mode === 'in' ? 'Bienvenue sur' : 'Créer votre compte'}
                <span className="lg:hidden">{mode === 'in' ? ' KOMERCE' : ''}</span>
              </p>
              <img
                src="/logo.png"
                alt="KOMERCE — Gérez. Vendez. Progressez."
                className="anim-scale mx-auto mt-1 hidden h-32 w-auto object-contain transition duration-300 hover:brightness-105 lg:block"
                style={delay(0.3)}
              />
              <span className="anim-fade mx-auto mt-2 block h-0.5 w-10 bg-gold-400" style={delay(0.5)} />
              <p className="anim-up mt-4 text-[15px] text-black/55" style={delay(0.35)}>
                {mode === 'in' ? 'Connectez-vous pour accéder à votre espace' : 'Quelques secondes suffisent pour démarrer'}
              </p>
            </div>

            <div className={`mt-6 space-y-3 ${shaking ? 'shake' : ''}`}>
              {mode === 'up' && (
                <div className="anim-up">
                  <Field icon={<User size={20} />} label="Votre nom" value={name} onChange={(e) => { setName(e.target.value); clearError() }} placeholder="Ex : Aïcha Koné" autoComplete="name" invalid={invalid && !name.trim()} />
                </div>
              )}
              <div className="anim-up" style={delay(0.42)}>
                <Field icon={<Phone size={20} />} label="Numéro de téléphone" type="tel" inputMode="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clearError() }} placeholder="Ex : 0700000000" autoComplete="tel" invalid={invalid} />
              </div>
              <div className="anim-up" style={delay(0.5)}>
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

            <div className="anim-up mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm" style={delay(0.58)}>
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

            <div className="my-4 flex items-center gap-4 text-sm text-black/40" aria-hidden>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-black/10" /> ou <span className="h-px flex-1 bg-gradient-to-l from-transparent to-black/10" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={google}
              disabled={loading}
              aria-busy={busy === 'google'}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-3.5 font-bold text-ink shadow-[0_1px_2px_rgb(10_31_22/0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:bg-black/[0.015] hover:shadow-[0_12px_26px_-14px_rgb(10_31_22/0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none dark:text-white"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {busy === 'google' ? <Loader2 size={18} className="animate-spin text-brand-600" /> : <span className="transition-transform duration-300 group-hover:scale-110"><GoogleG /></span>}
              </span>
              {busy === 'google' ? 'Connexion à Google…' : 'Continuer avec Google'}
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
        </main>
      </div>

      {/* ---------- Bandeau de confiance ---------- */}
      <footer className="anim-fade hidden border-t border-black/5 bg-white/80 py-4 backdrop-blur lg:block" style={delay(1.5)}>
        <div className="mx-auto flex max-w-4xl items-center justify-around">
          {[
            [Lock, 'Sécurisé', 'Vos données protégées'],
            [Zap, 'Rapide', 'Accès en un instant'],
            [Laptop, 'Accessible', 'Sur tous vos appareils'],
          ].map(([Icon, t, s]) => {
            const I = Icon as typeof Lock
            return (
              <div key={t as string} className="flex items-center gap-3">
                <I size={26} className="text-ink" strokeWidth={1.6} />
                <div className="text-sm leading-tight"><b>{t as string}</b><div className="text-xs text-black/45">{s as string}</div></div>
              </div>
            )
          })}
        </div>
      </footer>
    </div>
  )
}
