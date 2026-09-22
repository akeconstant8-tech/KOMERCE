import { useMemo } from 'react'
import { Truck } from 'lucide-react'
import { useStore } from '../lib/store'
import { fcfa } from '../lib/format'
import { PageHeader } from '../components/ui'

export default function Suppliers() {
  const products = useStore((s) => s.products)
  const groups = useMemo(() => {
    const m = new Map<string, typeof products>()
    for (const p of products) {
      const k = p.supplier.trim() || 'Sans fournisseur'
      m.set(k, [...(m.get(k) ?? []), p])
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [products])

  return (
    <div>
      <PageHeader title="Fournisseurs" subtitle={`${groups.length} fournisseurs · déduits de vos fiches produit`} />
      <div className="space-y-3">
        {groups.map(([name, items]) => {
          const low = items.filter((p) => p.qty <= p.alertThreshold)
          return (
            <div key={name} className="rounded-3xl bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white"><Truck size={22} /></span>
                <div className="flex-1">
                  <b>{name}</b>
                  <div className="text-xs text-black/50">
                    {items.length} produits · valeur du stock {fcfa(items.reduce((a, p) => a + p.qty * p.buyPrice, 0))}
                  </div>
                </div>
                {low.length > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700">{low.length} à commander</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {items.map((p) => (
                  <span key={p.id} className={`rounded-full px-3 py-1 text-xs font-semibold ${p.qty <= p.alertThreshold ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
                    {p.emoji} {p.name} · {p.qty}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
