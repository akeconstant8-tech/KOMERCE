import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useStore } from '../lib/store'
import { DAY, fcfa, num, startOfDay } from '../lib/format'
import { dailySeries, summarize, topProducts } from '../lib/stats'
import { useToasts } from '../lib/toast'
import { AnimatedNumber, Card, Field, PageHeader, btnPrimary } from '../components/ui'

const ranges = [
  { label: "Aujourd'hui", days: 0 },
  { label: '7 jours', days: 6 },
  { label: '30 jours', days: 29 },
]

export default function Analytics() {
  const { sales, expenses, addExpense, deleteExpense, resetDemo } = useStore()
  const push = useToasts((s) => s.push)
  const [range, setRange] = useState(1)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')

  const from = startOfDay() - ranges[range].days * DAY
  const s = summarize(sales, expenses, from)
  const top = topProducts(sales, from)
  const series = dailySeries(sales, 7)
  const medals = ['🥇', '🥈', '🥉']

  const rows = [
    ['Chiffre d\'affaires', s.revenue],
    ['Marge brute', s.margin],
    ['Dépenses', s.expenses],
    ['Bénéfice estimé', s.profit],
  ] as const

  return (
    <div>
      <PageHeader title="Analyse" subtitle="Vos performances en un coup d'œil" />
      <div className="mb-4 flex gap-2">
        {ranges.map((r, i) => (
          <button key={r.label} onClick={() => setRange(i)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${i === range ? 'bg-ink text-white shadow-card' : 'bg-white text-black/55 shadow-card'}`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {rows.map(([name, v]) => (
          <Card key={name} className={name === 'Bénéfice estimé' ? 'mesh !bg-transparent text-white' : ''}>
            <div className="text-xs opacity-70">{name}</div>
            <div className="mt-1 text-xl font-black">
              <AnimatedNumber value={v} />
            </div>
            <div className="text-[10px] opacity-60">FCFA</div>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-black/45">{s.count} ventes sur la période</p>

      <h2 className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-black/40">📈 ÉVOLUTION DES VENTES</h2>
      <Card className="!px-2">
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={series} margin={{ left: 8, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0b7a42" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#0b7a42" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip formatter={(v) => fcfa(Number(v))} contentStyle={{ borderRadius: 16, border: 0, boxShadow: "0 10px 30px -10px rgba(0,0,0,.25)" }} />
            <Area type="monotone" dataKey="ca" stroke="#0b7a42" strokeWidth={3} fill="url(#g)" animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <h2 className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-black/40">PRODUITS POPULAIRES</h2>
      <Card className="space-y-2">
        {top.map((p, i) => (
          <div key={p.name} className="flex items-center justify-between">
            <span>{medals[i] ?? '•'} {p.name}</span>
            <span className="text-sm text-black/55">{num(p.qty)} vendus</span>
          </div>
        ))}
        {!top.length && <p className="text-sm text-black/40">Pas de ventes sur la période</p>}
      </Card>

      <h2 className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-black/40">AJOUTER UNE DÉPENSE</h2>
      <Card className="space-y-3">
        <Field label="Libellé" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Field label="Montant (FCFA)" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button
          className={`${btnPrimary} w-full`}
          onClick={() => {
            if (!label.trim() || !(Number(amount) > 0)) return push('Libellé et montant requis', 'warn')
            addExpense(label.trim(), Number(amount))
            setLabel('')
            setAmount('')
            push('Dépense enregistrée')
          }}
        >
          Enregistrer
        </button>
        <div className="divide-y divide-black/5">
          {expenses.slice(0, 5).map((e) => (
            <div key={e.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="flex-1">{e.label}</span>
              <b>{fcfa(e.amount)}</b>
              <button onClick={() => { deleteExpense(e.id); push('Dépense supprimée') }} className="rounded-xl bg-red-50 p-2 text-red-500 active:scale-90 dark:bg-red-500/15" aria-label="Supprimer la dépense">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <button
        onClick={() => confirm('Remettre les données de démonstration ?') && resetDemo()}
        className="mt-6 w-full text-center text-xs text-black/40 underline"
      >
        Réinitialiser les données de démo
      </button>
    </div>
  )
}
