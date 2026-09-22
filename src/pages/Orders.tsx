import { useState } from 'react'
import { Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { fcfa } from '../lib/format'
import { useToasts } from '../lib/toast'
import { PageHeader } from '../components/ui'
import { StatusChip, statusOf, whenLabel } from './Home'

const filters = ['Toutes', 'En cours', 'Livrée'] as const

export default function Orders() {
  const { sales, customers, setSaleStatus } = useStore()
  const push = useToasts((s) => s.push)
  const [f, setF] = useState<(typeof filters)[number]>('Toutes')
  const shown = sales.filter((s) => f === 'Toutes' || statusOf(s) === f)
  const pending = sales.filter((s) => statusOf(s) === 'En cours').length

  return (
    <div>
      <PageHeader title="Commandes" subtitle={`${sales.length} commandes · ${pending} en cours`} />
      <div className="mb-4 flex gap-2">
        {filters.map((x) => (
          <button key={x} onClick={() => setF(x)} className={`rounded-full px-4 py-1.5 text-sm font-semibold shadow-card ${f === x ? 'bg-ink text-white' : 'bg-white text-black/55'}`}>
            {x === 'Livrée' ? 'Livrées' : x}
          </button>
        ))}
      </div>
      <div className="divide-y divide-black/5 rounded-3xl bg-white p-2 shadow-card">
        {shown.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-3.5">
            <div className="min-w-[7rem]">
              <b className="text-sm">#CMD-{s.number}</b>
              <div className="text-xs text-black/45">{whenLabel(s.date)}</div>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="truncate font-semibold">{customers.find((c) => c.id === s.customerId)?.name ?? 'Client comptoir'}</div>
              <div className="truncate text-xs text-black/45">{s.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</div>
            </div>
            <b className="text-sm">{fcfa(s.total)}</b>
            <StatusChip s={s} />
            {statusOf(s) === 'En cours' ? (
              <button
                onClick={() => {
                  setSaleStatus(s.id, 'Livrée')
                  push(`Commande #${s.number} livrée`)
                }}
                className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95"
              >
                <Check size={14} /> Marquer livrée
              </button>
            ) : (
              <span className="w-[8.6rem]" />
            )}
          </div>
        ))}
        {!shown.length && <p className="py-10 text-center text-black/40">Aucune commande</p>}
      </div>
    </div>
  )
}
