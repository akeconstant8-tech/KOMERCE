import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { num } from '../lib/format'
import { useToasts } from '../lib/toast'

/** Compteur qui s'anime vers sa nouvelle valeur. */
export function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)
  useEffect(() => {
    const c = animate(prev.current, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = num(v) + suffix
      },
    })
    prev.current = value
    return () => c.stop()
  }, [value, suffix])
  return <span ref={ref}>{num(0) + suffix}</span>
}

/** Apparition en fondu décalée, pour donner du rythme aux pages. */
export function Reveal({ children, i = 0, className = '' }: { children: ReactNode; i?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white p-4 shadow-card ${className}`}>{children}</div>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2.5 mt-7 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-black/40">{children}</h2>
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <h1 className="text-[28px] font-extrabold leading-none tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-black/50">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-paper p-5 pt-3 safe-b"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => i.offset.y > 120 && onClose()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{title}</h2>
              <button onClick={onClose} className="rounded-full bg-white p-2 shadow-card" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-black/50">{label}</span>
      <input {...p} className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 font-medium shadow-card transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
    </label>
  )
}

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-3.5 font-extrabold text-white shadow-glow transition active:scale-[0.97] disabled:from-black/20 disabled:to-black/25 disabled:shadow-none'

/** Pluie de confettis pour célébrer une vente. */
export function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        x: (Math.random() - 0.5) * 340,
        y: -(80 + Math.random() * 220),
        r: Math.random() * 540 - 270,
        c: ['#12934f', '#d9a72c', '#f0d27f', '#2fae6b', '#ffffff'][i % 5],
        d: Math.random() * 0.15,
        w: 6 + Math.random() * 6,
      })),
    [],
  )
  return (
    <div className="pointer-events-none absolute left-1/2 top-24 z-10">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-sm"
          style={{ background: b.c, width: b.w, height: b.w * 1.6 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 320], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: 1.7, delay: b.d, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export function Toasts() {
  const items = useToasts((s) => s.items)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className={`flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-2xl ${t.tone === 'success' ? 'bg-brand-700' : 'bg-amber-500'}`}
          >
            {t.tone === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
