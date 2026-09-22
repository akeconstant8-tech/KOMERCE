import { create } from 'zustand'
import { uid } from './format'

interface Toast {
  id: string
  text: string
  tone: 'success' | 'warn'
}

export const useToasts = create<{ items: Toast[]; push: (text: string, tone?: Toast['tone']) => void }>((set) => ({
  items: [],
  push: (text, tone = 'success') => {
    const id = uid()
    set((s) => ({ items: [...s.items, { id, text, tone }] }))
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3500)
  },
}))
