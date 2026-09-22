import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useTheme = create<{ dark: boolean; toggle: () => void }>()(
  persist((set) => ({ dark: false, toggle: () => set((s) => ({ dark: !s.dark })) }), { name: 'komerce-theme' }),
)
