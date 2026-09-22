import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Minus, Plus, Search, Share2, ShoppingBasket } from 'lucide-react'
import { useStore } from '../lib/store'
import { fcfa, num, timeFr } from '../lib/format'
import { useToasts } from '../lib/toast'
import { AnimatedNumber, Confetti, PageHeader, SectionTitle, btnPrimary } from '../components/ui'
import type { Sale } from '../lib/types'

export default function Pos() {
  const { products, customers, checkout } = useStore()
  const push = useToasts((s) => s.push)
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [customerId, setCustomerId] = useState('')
  const [paidInput, setPaidInput] = useState('')
  const [deliver, setDeliver] = useState(false)
  const [done, setDone] = useState<Sale | null>(null)

  const shown = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  )
  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ p: products.find((x) => x.id === id)!, qty }))
    .filter((l) => l.p)
  const total = lines.reduce((a, l) => a + l.p.sellPrice * l.qty, 0)
  const count = lines.reduce((a, l) => a + l.qty, 0)

  const change = (id: string, delta: number) => {
    const p = products.find((x) => x.id === id)!
    const next = (cart[id] ?? 0) + delta
    if (next > p.qty) return push(`Stock insuffisant : ${p.qty} ${p.name} disponible(s)`, 'warn')
    setCart((c) => {
      const { [id]: _, ...rest } = c
      return next > 0 ? { ...c, [id]: next } : rest
    })
  }

  const pay = () => {
    const paid = paidInput === '' ? total : Number(paidInput)
    const sale = checkout(lines.map((l) => ({ productId: l.p.id, qty: l.qty })), customerId || undefined, paid, deliver ? 'En cours' : undefined)
    if (!sale) return push('Vente impossible', 'warn')
    for (const l of lines) {
      const after = l.p.qty - l.qty
      if (after <= l.p.alertThreshold) push(`${l.p.name} : stock faible (${after}) — pensez à réapprovisionner`, 'warn')
    }
    setDone(sale)
    setCart({})
    setPaidInput('')
    setCustomerId('')
    setDeliver(false)
  }

  const share = (s: Sale) => {
    const text =
      `Reçu KOMERCE #${s.number}\n` +
      s.items.map((i) => `${i.name} × ${i.qty}  ${num(i.price * i.qty)}`).join('\n') +
      `\nTOTAL ${fcfa(s.total)}`
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div>
      <PageHeader title="Mode caisse" subtitle="Touchez un produit pour l'ajouter" />
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit"
          className="w-full rounded-2xl border border-transparent bg-white py-3.5 pl-11 pr-4 font-medium shadow-card transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {shown.map((p, i) => {
          const inCart = cart[p.id] ?? 0
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.92 }}
              disabled={p.qty === 0}
              onClick={() => change(p.id, 1)}
              className={`relative rounded-3xl p-3 text-center transition disabled:opacity-40 ${inCart ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white shadow-card'}`}
            >
              <AnimatePresence>
                {inCart > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-extrabold text-white shadow-glow">
                    {inCart}
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-paper text-2xl">{p.emoji}</div>
              <div className="mt-2 line-clamp-2 min-h-8 text-xs font-bold leading-tight">{p.name}</div>
              <div className="mt-1 text-xs font-extrabold text-brand-700">{num(p.sellPrice)}</div>
              <div className="text-[10px] text-black/35">{p.qty} en stock</div>
            </motion.button>
          )
        })}
      </div>

      <SectionTitle>Panier {count > 0 && `· ${count} article${count > 1 ? 's' : ''}`}</SectionTitle>
      <div className="rounded-3xl bg-white p-4 shadow-card">
        {lines.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-black/30">
            <ShoppingBasket size={32} />
            <p className="text-sm font-semibold">Le panier est vide</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {lines.map(({ p, qty }) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 py-2">
              <span className="text-xl">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{p.name}</div>
                <div className="text-xs text-black/45">{num(p.sellPrice * qty)}</div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-paper p-1">
                <button onClick={() => change(p.id, -1)} className="rounded-full bg-white p-1.5 shadow-sm active:scale-90"><Minus size={14} /></button>
                <span className="w-5 text-center text-sm font-extrabold">{qty}</span>
                <button onClick={() => change(p.id, 1)} className="rounded-full bg-white p-1.5 shadow-sm active:scale-90"><Plus size={14} /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {lines.length > 0 && (
          <>
            <div className="mt-2 flex items-end justify-between border-t border-dashed border-black/15 pt-4">
              <span className="text-xs font-extrabold tracking-[0.14em] text-black/45">TOTAL</span>
              <span className="text-3xl font-extrabold tracking-tight">{fcfa(total)}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="rounded-2xl bg-paper px-3 py-3 text-sm font-semibold">
                <option value="">Client comptoir</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {customerId && (
                <input
                  type="number"
                  inputMode="numeric"
                  value={paidInput}
                  onChange={(e) => setPaidInput(e.target.value)}
                  placeholder={`Payé (${num(total)})`}
                  className="rounded-2xl bg-paper px-3 py-3 text-sm font-semibold"
                />
              )}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={deliver} onChange={(e) => setDeliver(e.target.checked)} className="h-4 w-4 accent-brand-600" />
              Commande à livrer (statut « En cours »)
            </label>
            {customerId && paidInput !== '' && Number(paidInput) < total && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Crédit client : {fcfa(total - Number(paidInput))}</p>
            )}
          </>
        )}
      </div>

      <button disabled={!lines.length} onClick={pay} className={`${btnPrimary} mt-4 w-full py-4 text-lg tracking-wide`}>
        ENCAISSER {lines.length ? fcfa(total) : ''}
      </button>

      <AnimatePresence>
        {done && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Confetti />
            <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 16 }} className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl">
              <div className="mesh px-6 pb-6 pt-7 text-center text-white">
                <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: 'spring', damping: 10 }} className="mx-auto w-fit">
                  <CheckCircle2 size={56} />
                </motion.div>
                <div className="mt-3 text-4xl font-extrabold tracking-tight">
                  +<AnimatedNumber value={done.total} />
                  <span className="ml-1 text-base font-bold text-white/70">FCFA</span>
                </div>
                <p className="mt-1 text-sm text-white/75">Vente #{done.number} enregistrée · stock mis à jour</p>
              </div>
              <div className="p-5">
                <div className="rounded-2xl bg-paper p-4 font-mono text-xs">
                  <div className="mb-2 text-center text-black/40">{timeFr(done.date)}</div>
                  {done.items.map((i) => (
                    <div key={i.productId} className="flex justify-between py-0.5">
                      <span>{i.name} × {i.qty}</span>
                      <span>{num(i.price * i.qty)}</span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-dashed border-black/20 pt-2 text-sm font-bold">
                    <span>TOTAL</span>
                    <span>{fcfa(done.total)}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => share(done)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-paper py-3 font-bold">
                    <Share2 size={16} /> Reçu
                  </button>
                  <button onClick={() => setDone(null)} className={`${btnPrimary} flex-[1.4]`}>Nouvelle vente</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
