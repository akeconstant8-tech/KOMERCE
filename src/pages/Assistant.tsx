import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { answer } from '../lib/assistant'
import { PageHeader } from '../components/ui'

interface Msg {
  from: 'me' | 'ai'
  text: string
}

const suggestions = [
  'Quels produits dois-je recommander cette semaine ?',
  'Combien ai-je gagné cette semaine ?',
  'Quels sont mes produits les plus vendus ?',
  'Qui me doit de l’argent ?',
]

export default function Assistant() {
  const data = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'ai', text: 'Bonjour ! Je suis votre assistant commercial. Posez-moi une question sur vos ventes ou votre stock.' }])
  const [input, setInput] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs])

  const ask = (text: string) => {
    if (!text.trim()) return
    setMsgs((m) => [...m, { from: 'me', text }, { from: 'ai', text: answer(text, data) }])
    setInput('')
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Assistant IA" subtitle="Analyse vos ventes et votre stock" right={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-400 text-ink"><Sparkles size={20} /></span>} />
      <div className="flex-1 space-y-3">
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[85%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm leading-relaxed ${m.from === 'me' ? 'ml-auto rounded-br-md bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow' : 'rounded-bl-md bg-white shadow-card'}`}>
            {m.text}
          </motion.div>
        ))}
        <div ref={end} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => ask(s)} className="rounded-full bg-white px-3.5 py-2 text-xs font-bold text-brand-700 shadow-card active:scale-95">
            {s}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Votre question…" className="min-w-0 flex-1 rounded-2xl border border-transparent bg-white px-4 py-3.5 font-medium shadow-card transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
        <button className="rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-white shadow-glow active:scale-95" aria-label="Envoyer"><Send size={18} /></button>
      </form>
    </div>
  )
}
