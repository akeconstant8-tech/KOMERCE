import { useState } from 'react'
import { Phone, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { fcfa, timeFr } from '../lib/format'
import { useToasts } from '../lib/toast'
import { Field, PageHeader, Sheet, btnPrimary } from '../components/ui'

export default function Customers() {
  const { customers, sales, saveCustomer, payCredit, deleteCustomer } = useStore()
  const push = useToasts((s) => s.push)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [openId, setOpenId] = useState<string | null>(null)
  const [pay, setPay] = useState('')

  const open = customers.find((c) => c.id === openId)
  const history = open ? sales.filter((s) => s.customerId === open.id) : []

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${customers.length} clients · ${fcfa(customers.reduce((a, c) => a + c.credit, 0))} de crédits`}
        right={
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-full bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-glow active:scale-95">
            <Plus size={16} /> Client
          </button>
        }
      />
      <div className="space-y-3">
        {customers.map((c) => {
          const mine = sales.filter((s) => s.customerId === c.id)
          return (
            <button key={c.id} onClick={() => setOpenId(c.id)} className="flex w-full items-center gap-3.5 rounded-3xl bg-white p-4 text-left shadow-card active:scale-[0.99]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-lg font-extrabold text-white">{c.name.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <b className="block truncate">{c.name}</b>
                <div className="text-sm text-black/50">
                  {mine.length} achats · {fcfa(mine.reduce((a, s) => a + s.total, 0))}
                </div>
              </div>
              {c.credit > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700">Doit {fcfa(c.credit)}</span>}
            </button>
          )
        })}
        {!customers.length && <p className="py-10 text-center text-black/40">Aucun client pour l'instant</p>}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nouveau client">
        <div className="space-y-3">
          <Field label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Téléphone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <button
            className={`${btnPrimary} w-full`}
            onClick={() => {
              if (!form.name.trim()) return push('Le nom est obligatoire', 'warn')
              saveCustomer(form)
              setForm({ name: '', phone: '' })
              setAdding(false)
              push('Client ajouté')
            }}
          >
            Enregistrer
          </button>
        </div>
      </Sheet>

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ''}>
        {open && (
          <div>
            {open.phone && (
              <a href={`tel:${open.phone.replace(/\s/g, '')}`} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                <Phone size={16} /> {open.phone}
              </a>
            )}
            <div className="mb-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-3xl bg-white p-4 shadow-card">
                <div className="text-2xl font-black">{history.length}</div>
                <div className="text-xs text-black/55">achats</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-card">
                <div className="text-lg font-black">{fcfa(history.reduce((a, s) => a + s.total, 0))}</div>
                <div className="text-xs text-black/55">dépensés</div>
              </div>
            </div>
            {open.credit > 0 && (
              <div className="mb-4 rounded-2xl bg-amber-50 p-3">
                <div className="text-sm font-bold text-amber-700">Crédit : {fcfa(open.credit)}</div>
                <div className="mt-2 flex gap-2">
                  <input type="number" inputMode="numeric" value={pay} onChange={(e) => setPay(e.target.value)} placeholder="Montant reçu" className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
                  <button
                    className="rounded-xl bg-amber-500 px-4 text-sm font-bold text-white"
                    onClick={() => {
                      const a = Number(pay)
                      if (a > 0) {
                        payCredit(open.id, a)
                        setPay('')
                        push('Remboursement enregistré')
                      }
                    }}
                  >
                    Encaisser
                  </button>
                </div>
              </div>
            )}
            <h3 className="mb-1 text-xs font-bold tracking-wider text-black/50">HISTORIQUE</h3>
            <div className="divide-y divide-black/5">
              {history.map((s) => (
                <div key={s.id} className="flex justify-between py-2 text-sm">
                  <span>#{s.number} · {timeFr(s.date)}</span>
                  <b>{fcfa(s.total)}</b>
                </div>
              ))}
              {!history.length && <p className="py-3 text-sm text-black/40">Aucun achat</p>}
            </div>
            <button
              onClick={() => {
                if (confirm(`Supprimer le client « ${open.name} » ? Son historique de ventes est conservé.`)) {
                  deleteCustomer(open.id)
                  setOpenId(null)
                  push('Client supprimé')
                }
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3 font-bold text-red-600 active:scale-95"
            >
              <Trash2 size={18} /> Supprimer ce client
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
