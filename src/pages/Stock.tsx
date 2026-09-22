import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { fcfa } from '../lib/format'
import { useToasts } from '../lib/toast'
import { Card, Field, PageHeader, Sheet, btnPrimary } from '../components/ui'
import type { Product } from '../lib/types'

const empty: Omit<Product, 'id'> = {
  name: '', emoji: '📦', photo: undefined, buyPrice: 0, sellPrice: 0, qty: 0, alertThreshold: 5, category: '', supplier: '',
}

function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const s = 160 / Math.max(img.width, img.height)
      const c = document.createElement('canvas')
      c.width = img.width * Math.min(1, s)
      c.height = img.height * Math.min(1, s)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function Stock() {
  const { products, saveProduct, deleteProduct } = useStore()
  const push = useToasts((s) => s.push)
  const [editing, setEditing] = useState<(Omit<Product, 'id'> & { id?: string }) | null>(null)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  useEffect(() => {
    setQ(params.get('q') ?? '')
    if (params.get('new')) {
      setEditing(empty)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const shown = products.filter((p) => (p.name + p.category).toLowerCase().includes(q.toLowerCase()))
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setEditing((e) => e && { ...e, [k]: v })
  const n = (v: string) => Math.max(0, Number(v) || 0)

  const remove = (p: Product) => {
    if (confirm(`Supprimer « ${p.name} » ? Cette action est définitive.`)) {
      deleteProduct(p.id)
      push(`${p.name} supprimé`)
    }
  }

  const submit = () => {
    if (!editing?.name.trim()) return push('Le nom est obligatoire', 'warn')
    saveProduct(editing)
    push('Produit enregistré')
    setEditing(null)
  }

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle={`${products.length} produits · ${products.filter((p) => p.qty <= p.alertThreshold).length} à réapprovisionner`}
        right={
          <button onClick={() => setEditing(empty)} className="flex items-center gap-1 rounded-full bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-glow active:scale-95">
            <Plus size={16} /> Produit
          </button>
        }
      />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="mb-4 w-full rounded-2xl border border-transparent bg-white px-4 py-3.5 font-medium shadow-card transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
      <div className="space-y-3">
        {shown.map((p, i) => {
          const low = p.qty <= p.alertThreshold
          const pct = Math.min(100, (p.qty / Math.max(p.alertThreshold * 3, 1)) * 100)
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.04 }}
              className="flex w-full items-center gap-2 rounded-3xl bg-white p-3.5 shadow-card"
            >
              <button onClick={() => setEditing(p)} className="flex min-w-0 flex-1 items-center gap-3.5 text-left">
              {p.photo ? <img src={p.photo} className="h-14 w-14 rounded-2xl object-cover" alt="" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paper text-3xl">{p.emoji}</div>}
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">{p.name}</div>
                <div className="text-xs text-black/45">{p.category || 'Sans catégorie'} · {fcfa(p.sellPrice)}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }} className={`h-full rounded-full ${low ? 'bg-gradient-to-r from-amber-400 to-gold-400' : 'bg-gradient-to-r from-brand-400 to-brand-600'}`} />
                </div>
                {low && <div className="mt-1.5 text-[11px] font-bold text-amber-600">⚠️ Stock faible — pensez à réapprovisionner</div>}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-extrabold leading-none ${low ? 'text-amber-600' : ''}`}>{p.qty}</div>
                <div className="mt-1 text-[10px] font-semibold text-black/35">en stock</div>
              </div>
              </button>
              <button
                onClick={() => remove(p)}
                className="shrink-0 rounded-2xl bg-red-50 p-3 text-red-500 transition hover:bg-red-100 active:scale-90 dark:bg-red-500/15"
                aria-label={`Supprimer ${p.name}`}
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          )
        })}
      </div>

      {!shown.length && (
        <div className="rounded-3xl bg-white p-10 text-center shadow-card">
          <div className="text-4xl">📦</div>
          <p className="mt-2 font-bold">{q ? 'Aucun produit trouvé' : 'Aucun produit pour le moment'}</p>
          <button onClick={() => setEditing(empty)} className={`${btnPrimary} mt-4`}><Plus size={18} /> Ajouter un produit</button>
        </div>
      )}

      <button onClick={() => setEditing(empty)} className="fixed bottom-28 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow active:scale-90 lg:hidden" aria-label="Ajouter un produit">
        <Plus size={26} />
      </button>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Modifier le produit' : 'Nouveau produit'}>
        {editing && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-brand-600">
                {editing.photo ? <img src={editing.photo} className="h-full w-full object-cover" alt="" /> : <Camera />}
                <input type="file" accept="image/*" hidden onChange={async (e) => e.target.files?.[0] && set('photo', await resizePhoto(e.target.files[0]))} />
              </label>
              <div className="flex-1"><Field label="Nom" value={editing.name} onChange={(e) => set('name', e.target.value)} /></div>
              <div className="w-16"><Field label="Icône" value={editing.emoji} onChange={(e) => set('emoji', e.target.value)} /></div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['🥤', '💧', '🥖', '🍚', '🛢️', '🍬', '🧼', '🍅', '🥚', '🧃', '🍞', '👕', '💊', '📦'].map((e) => (
                <button key={e} type="button" onClick={() => set('emoji', e)} className={`h-9 w-9 rounded-xl text-lg ${editing.emoji === e ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-white shadow-card'}`}>{e}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix d'achat" type="number" inputMode="numeric" value={editing.buyPrice || ''} onChange={(e) => set('buyPrice', n(e.target.value))} />
              <Field label="Prix de vente" type="number" inputMode="numeric" value={editing.sellPrice || ''} onChange={(e) => set('sellPrice', n(e.target.value))} />
              <Field label="Quantité" type="number" inputMode="numeric" value={editing.qty || ''} onChange={(e) => set('qty', n(e.target.value))} />
              <Field label="Seuil d'alerte" type="number" inputMode="numeric" value={editing.alertThreshold || ''} onChange={(e) => set('alertThreshold', n(e.target.value))} />
              <Field label="Catégorie" value={editing.category} onChange={(e) => set('category', e.target.value)} />
              <Field label="Fournisseur" value={editing.supplier} onChange={(e) => set('supplier', e.target.value)} />
            </div>
            {editing.sellPrice > 0 && (
              <Card className="!bg-brand-50 text-sm">
                Marge unitaire : <b>{fcfa(editing.sellPrice - editing.buyPrice)}</b>
              </Card>
            )}
            <div className="flex gap-2">
              {editing.id && (
                <button
                  onClick={() => {
                    if (confirm('Supprimer ce produit ?')) {
                      deleteProduct(editing.id!)
                      setEditing(null)
                    }
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-600 active:scale-95"
                >
                  <Trash2 size={18} /> Supprimer
                </button>
              )}
              <button onClick={submit} className={`${btnPrimary} flex-1`}>Enregistrer</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
