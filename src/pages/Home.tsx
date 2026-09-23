import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle, BarChart3, ChevronRight, ClipboardList, Cloud, Headphones, MoreHorizontal, Package, Plus, ShieldCheck,
  ShoppingBag, ShoppingCart, Smartphone, Sprout, TrendingUp, UserPlus, Users, Crown, Check, Hourglass,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { DAY, fcfa, num, startOfDay } from '../lib/format'
import { dailySeries, summarize, topProducts } from '../lib/stats'
import { AnimatedNumber, Reveal } from '../components/ui'
import type { Sale } from '../lib/types'

/* ---------- petits blocs ---------- */

function Panel({ title, icon, right, className = '', children }: { title: string; icon?: ReactNode; right?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-[1.75rem] bg-white p-5 shadow-card ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>}
          <h2 className="font-extrabold">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

const tones = {
  blue: { card: 'bg-gradient-to-br from-brand-500 to-brand-700 text-white', icon: 'bg-white/20 text-white', chip: 'bg-white/20 text-white', line: '#ffffff', sub: 'text-white/85' },
  green: { card: 'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-500/15 dark:to-teal-500/5', icon: 'bg-gradient-to-br from-teal-400 to-teal-600 text-white', chip: 'bg-teal-500/15 text-teal-700 dark:text-teal-300', line: '#14a89a', sub: '' },
  orange: { card: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/15 dark:to-amber-500/5', icon: 'bg-gradient-to-br from-amber-300 to-amber-500 text-white', chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', line: '#d9a72c', sub: '' },
  purple: { card: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-500/15 dark:to-slate-500/5', icon: 'bg-gradient-to-br from-slate-500 to-slate-700 text-white', chip: 'bg-slate-500/15 text-slate-700 dark:text-slate-300', line: '#64748b', sub: '' },
}

function Kpi({ tone, title, icon, value, suffix, chip, data, id }: { tone: keyof typeof tones; title: string; icon: ReactNode; value: number; suffix?: string; chip: ReactNode; data: { v: number }[]; id: string }) {
  const t = tones[tone]
  return (
    <div className={`relative overflow-hidden rounded-[1.75rem] p-4 shadow-card ${t.card}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.icon}`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-bold ${t.sub || 'text-black/70'}`}>{title}</div>
          <div className="mt-0.5 truncate text-[26px] font-extrabold leading-tight tracking-tight">
            <AnimatedNumber value={value} />
            {suffix && <span className="ml-1 text-sm font-bold opacity-80">{suffix}</span>}
          </div>
        </div>
        <MoreHorizontal size={18} className="opacity-40" />
      </div>
      <div className="relative z-10 mt-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${t.chip}`}>{chip}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-14 opacity-90">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.line} stopOpacity={0.35} />
                <stop offset="100%" stopColor={t.line} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={t.line} strokeWidth={2} fill={`url(#${id})`} animationDuration={1100} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="h-6" />
    </div>
  )
}

const growthChip = (g: number | null, label = 'vs hier') =>
  g === null ? (
    <>Nouveau</>
  ) : (
    <>
      <TrendingUp size={12} className={g < 0 ? 'rotate-90' : ''} /> {g >= 0 ? '+' : ''}
      {g.toFixed(1).replace('.', ',')}% {label}
    </>
  )
const pct = (now: number, before: number) => (before > 0 ? ((now - before) / before) * 100 : null)

export const statusOf = (s: Sale) => s.status ?? 'Livrée'
export function StatusChip({ s }: { s: Sale }) {
  const st = statusOf(s)
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${st === 'Livrée' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'}`}>
      {st}
    </span>
  )
}
export function whenLabel(t: number) {
  const d = new Date(t)
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const diff = Math.round((startOfDay() - startOfDay(t)) / DAY)
  if (diff === 0) return `Aujourd'hui ${time}`
  if (diff === 1) return `Hier ${time}`
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${time}`
}

const donutColors = ['#0b7a42', '#d9a72c', '#14a89a', '#64748b']

/* ---------- page ---------- */

export default function Home() {
  const { products, sales, expenses, customers } = useStore()
  const navigate = useNavigate()
  const [range, setRange] = useState<7 | 30>(7)
  const today = startOfDay()

  const t = summarize(sales, expenses, today)
  const y = summarize(sales, expenses, today - DAY, today)
  const low = products.filter((p) => p.qty <= p.alertThreshold)
  const pending = sales.filter((s) => statusOf(s) === 'En cours').length
  const week = dailySeries(sales, 7)
  const chart = useMemo(() => dailySeries(sales, range), [sales, range])
  const hour = new Date().getHours()

  const top = topProducts(sales, today - 6 * DAY, 5)
  const topTotal = top.reduce((a, p) => a + p.qty, 0) || 1
  const barColors = ['from-brand-600 to-brand-400', 'from-amber-500 to-amber-300', 'from-teal-500 to-teal-400', 'from-slate-500 to-slate-400', 'from-lime-600 to-lime-400']

  const donut = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of sales) {
      if (s.date < today - 6 * DAY) continue
      for (const i of s.items) {
        const c = products.find((p) => p.id === i.productId)?.category || 'Autres'
        m.set(c, (m.get(c) ?? 0) + i.qty * i.price)
      }
    }
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1])
    const head = sorted.slice(0, 3)
    const rest = sorted.slice(3).reduce((a, [, v]) => a + v, 0)
    if (rest) head.push(['Autres', rest])
    const total = head.reduce((a, [, v]) => a + v, 0)
    return { total, rows: head.map(([name, value], i) => ({ name, value, share: Math.round((value / total) * 100), color: donutColors[i] })) }
  }, [sales, products, today])

  const clientName = (s: Sale) => customers.find((c) => c.id === s.customerId)?.name ?? 'Client comptoir'

  const quick = [
    { label: 'Nouveau produit', icon: <Plus size={22} />, to: '/stock?new=1', cls: 'from-brand-50 to-brand-100 dark:from-brand-500/15 dark:to-brand-500/5', ic: 'bg-brand-500' },
    { label: 'Nouvelle vente', icon: <ShoppingCart size={22} />, to: '/caisse', cls: 'from-amber-50 to-amber-100 dark:from-amber-500/15 dark:to-amber-500/5', ic: 'bg-amber-500' },
    { label: 'Voir les commandes', icon: <ClipboardList size={22} />, to: '/commandes', cls: 'from-slate-50 to-slate-100 dark:from-slate-500/15 dark:to-slate-500/5', ic: 'bg-slate-600' },
    { label: 'Nouveau client', icon: <UserPlus size={22} />, to: '/clients', cls: 'from-teal-50 to-teal-100 dark:from-teal-500/15 dark:to-teal-500/5', ic: 'bg-teal-500' },
  ]

  return (
    <div className="space-y-4">
      {/* Bannière */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-brand-50 to-brand-100 p-6 shadow-card dark:from-[#0f1f18] dark:via-[#0d2a1d] dark:to-[#0b3a24] sm:p-8">
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h1 className="text-4xl font-black tracking-tight text-brand-900 dark:text-white sm:text-5xl">
                {hour < 18 ? 'Bonjour' : 'Bonsoir'} ! <span className="inline-block origin-[70%_70%] animate-[wave_2.2s_ease-in-out_1]">👋</span>
              </h1>
              <p className="mt-2 text-lg font-bold text-brand-700 dark:text-brand-200">Transformons vos idées en grandes réalisations.</p>
              <p className="mt-1 text-sm italic text-black/50">« De petites actions font de grands résultats. »</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/stock?new=1" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-glow active:scale-95">
                  <Plus size={18} /> Ajouter un produit
                </Link>
                <Link to="/analyse" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-brand-700 shadow-card active:scale-95">
                  <BarChart3 size={18} /> Voir les statistiques
                </Link>
              </div>
            </div>
            <img src="/logo.png" alt="KOMERCE" className="hidden h-44 w-auto shrink-0 object-contain drop-shadow-xl md:block" />
            <div className="hidden rounded-3xl bg-white/70 p-4 text-sm font-semibold ring-1 ring-black/5 backdrop-blur 2xl:block">
              {[[Users, 'Plus de clients'], [TrendingUp, 'Plus de ventes'], [Sprout, 'Plus de croissance']].map(([Icon, label]) => {
                const I = Icon as typeof Users
                return (
                  <div key={label as string} className="flex items-center gap-3 py-1.5 text-black/70"><I size={17} className="text-brand-600" /> {label as string}</div>
                )
              })}
            </div>
          </div>
        </section>
      </Reveal>

      {/* KPI */}
      <Reveal i={1} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi id="k1" tone="blue" title="Chiffre d'affaires" icon={<BarChart3 size={22} />} value={t.revenue} suffix="FCFA" chip={growthChip(pct(t.revenue, y.revenue))} data={week.map((d) => ({ v: d.ca }))} />
        <Kpi id="k2" tone="green" title="Produits" icon={<Package size={22} />} value={products.length} chip={low.length ? <><AlertTriangle size={12} /> {low.length} à réappro</> : <><Check size={12} /> Stock OK</>} data={week.map(() => ({ v: products.length }))} />
        <Kpi id="k3" tone="orange" title="Ventes" icon={<ShoppingCart size={22} />} value={t.count} chip={growthChip(pct(t.count, y.count))} data={week.map((d) => ({ v: d.count }))} />
        <Kpi id="k4" tone="purple" title="Commandes" icon={<ClipboardList size={22} />} value={sales.length} chip={<><Hourglass size={12} /> {pending} en attente</>} data={week.map((d) => ({ v: d.count }))} />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        {/* Évolution */}
        <Reveal i={2} className="md:col-span-2 xl:col-span-5">
          <Panel
            title="Évolution des ventes"
            icon={<TrendingUp size={20} />}
            className="h-full"
            right={
              <select value={range} onChange={(e) => setRange(Number(e.target.value) as 7 | 30)} className="rounded-xl border border-black/10 bg-transparent px-3 py-1.5 text-xs font-bold">
                <option value={7}>Cette semaine</option>
                <option value={30}>30 jours</option>
              </select>
            }
          >
            <p className="-mt-2 mb-3 text-xs text-black/45">Suivez la performance de votre activité en temps réel.</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chart} margin={{ left: -12, right: 8, top: 10 }}>
                <defs>
                  <linearGradient id="evo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0b7a42" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0b7a42" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={range === 30 ? 4 : 0} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => num(v)} width={56} />
                <Tooltip formatter={(v) => [fcfa(Number(v)), 'CA']} contentStyle={{ borderRadius: 14, border: 0, background: '#0a1f16', color: '#fff', boxShadow: '0 10px 30px -10px rgba(0,0,0,.4)' }} labelStyle={{ color: '#8fe0b3' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="ca" stroke="#0b7a42" strokeWidth={3} fill="url(#evo)" dot={{ r: 3.5, fill: '#fff', stroke: '#0b7a42', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={1100} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </Reveal>

        {/* Répartition */}
        <Reveal i={3} className="xl:col-span-4">
          <Panel title="Répartition des ventes" icon={<ShoppingBag size={20} />} className="h-full">
            {donut.total === 0 ? (
              <p className="flex h-44 items-center justify-center text-sm text-black/40">Aucune vente cette semaine</p>
            ) : (
            <div className="flex items-center gap-3">
              <div className="relative h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut.rows} dataKey="value" innerRadius="66%" outerRadius="100%" paddingAngle={3} cornerRadius={8} stroke="none" animationDuration={1000}>
                      {donut.rows.map((r) => <Cell key={r.name} fill={r.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-extrabold">{num(donut.total)}</div>
                  <div className="text-[11px] font-semibold text-black/45">FCFA</div>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-3 text-sm">
                {donut.rows.map((r) => (
                  <li key={r.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                    <span className="flex-1 truncate font-medium">{r.name}</span>
                    <b>{r.share}%</b>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </Panel>
        </Reveal>

        {/* Actions rapides */}
        <Reveal i={4} className="md:col-span-2 xl:col-span-3">
          <Panel title="Actions rapides" className="h-full">
            <div className="grid grid-cols-2 gap-3">
              {quick.map((a) => (
                <button key={a.label} onClick={() => navigate(a.to)} className={`flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br p-3.5 text-center transition active:scale-95 ${a.cls}`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md ${a.ic}`}>{a.icon}</span>
                  <span className="text-xs font-bold leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </Panel>
        </Reveal>

        {/* Commandes */}
        <Reveal i={5} className="md:col-span-2 xl:col-span-5">
          <Panel
            title="Dernières commandes"
            icon={<ClipboardList size={20} />}
            className="h-full"
            right={<Link to="/commandes" className="whitespace-nowrap rounded-xl border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-600">Voir tout ›</Link>}
          >
            <div className="grid grid-cols-[1.2fr_1.9fr_1.4fr_1fr] gap-2 px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-black/35">
              <span>#</span><span>Client</span><span>Montant</span><span>Statut</span>
            </div>
            <div className="divide-y divide-black/5">
              {sales.slice(0, 5).map((s) => (
                <div key={s.id} className="grid grid-cols-[1.2fr_1.9fr_1.4fr_1fr] items-center gap-2 px-2 py-3 text-xs">
                  <b className="whitespace-nowrap">#CMD-{s.number}</b>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{clientName(s)}</div>
                    <div className="truncate text-[11px] text-black/45">{whenLabel(s.date)}</div>
                  </div>
                  <b className="whitespace-nowrap text-[13px]">{fcfa(s.total)}</b>
                  <span><StatusChip s={s} /></span>
                </div>
              ))}
            </div>
          </Panel>
        </Reveal>

        {/* Top produits */}
        <Reveal i={6} className="xl:col-span-4">
          <Panel
            title="Produits les plus vendus"
            icon={<Crown size={20} />}
            className="h-full"
            right={<Link to="/analyse" className="whitespace-nowrap rounded-xl border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-600">Voir tout ›</Link>}
          >
            <div className="space-y-3.5">
              {top.map((p, i) => {
                const share = Math.round((p.qty / topTotal) * 100)
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-xl">{products.find((x) => x.id === p.id)?.emoji ?? '📦'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-sm"><b className="truncate">{p.name}</b><span className="text-xs font-bold text-black/50">{share}%</span></div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/5">
                        <div className={`h-full rounded-full bg-gradient-to-r ${barColors[i]}`} style={{ width: `${share}%`, transition: 'width 1s' }} />
                      </div>
                      <div className="mt-0.5 text-[11px] text-black/40">{p.qty} vendus</div>
                    </div>
                  </div>
                )
              })}
              {!top.length && <p className="text-sm text-black/40">Pas encore de ventes</p>}
            </div>
          </Panel>
        </Reveal>

        {/* Promo */}
        <Reveal i={7} className="hidden md:col-span-2 xl:col-span-3 xl:block">
          <div className="mesh relative flex h-full flex-col justify-between overflow-hidden rounded-[1.75rem] p-5 text-white shadow-card">
            <Crown size={26} className="text-gold-400" />
            <div className="absolute -bottom-6 -right-4 text-[7rem] leading-none opacity-90">👩🏾‍💼</div>
            <div className="relative">
              <h3 className="text-xl font-extrabold leading-tight">Faites passer votre business au niveau supérieur</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-white/85">
                {['Vendez plus', 'Gérez facilement', 'Suivez vos performances'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check size={15} className="text-emerald-300" /> {f}</li>
                ))}
              </ul>
            </div>
            <Link to="/talents" className="relative mt-5 inline-flex items-center justify-between gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-brand-700 active:scale-95">
              Découvrir KOMERCE <ChevronRight size={16} />
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Alerte stock (mobile et bureau) */}
      {low.length > 0 && (
        <Link to="/stock" className="flex items-center gap-3 rounded-3xl bg-gradient-to-r from-amber-50 to-gold-300/30 p-4 ring-1 ring-amber-200/70 dark:from-amber-500/10 dark:to-amber-500/5 dark:ring-amber-500/20">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-card"><AlertTriangle size={20} /></span>
          <div className="min-w-0 flex-1 text-sm">
            <b>Stock faible — pensez à réapprovisionner</b>
            <div className="truncate text-black/55">{low.map((p) => `${p.name} (${p.qty})`).join(' · ')}</div>
          </div>
          <ChevronRight size={18} className="text-black/30" />
        </Link>
      )}

      {/* Bandeau confiance */}
      <div className="hidden grid-cols-3 gap-4 rounded-[1.75rem] bg-white p-4 shadow-card lg:grid">
        {[
          [ShieldCheck, 'Sécurisé', 'Vos données sont protégées'],
          [Smartphone, 'Accessible partout', 'Sur ordinateur, tablette et mobile'],
          [Headphones, 'Support 24/7', "Notre équipe est là pour vous"],
        ].map(([Icon, title, sub]) => {
          const I = Icon as typeof Cloud
          return (
            <div key={title as string} className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><I size={24} /></span>
              <div className="text-sm"><b>{title as string}</b><div className="text-xs text-black/45">{sub as string}</div></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
