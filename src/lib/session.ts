import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const ALIVE = 'komerce-alive'

interface Session {
  user: string | null
  accountId: string | null
  remember: boolean
  login: (name: string, accountId: string, remember?: boolean) => void
  logout: () => void
}

/**
 * Session locale : `user` est le nom affiché. Sans « Se souvenir de moi », la session s'arrête
 * à la fermeture du navigateur. Les données commerciales restent sur l'appareil après déconnexion.
 */
export const useSession = create<Session>()(
  persist(
    (set) => ({
      user: null,
      accountId: null,
      remember: true,
      login: (name, accountId, remember = true) => {
        try {
          sessionStorage.setItem(ALIVE, '1')
        } catch {
          /* stockage indisponible : la session reste en mémoire */
        }
        set({ user: name, accountId, remember })
      },
      logout: () => set({ user: null, accountId: null }),
    }),
    {
      name: 'komerce-session-v2',
      onRehydrateStorage: () => (state) => {
        try {
          if (state?.user && !state.remember && !sessionStorage.getItem(ALIVE)) {
            queueMicrotask(() => useSession.setState({ user: null, accountId: null }))
          }
        } catch {
          /* ignoré */
        }
      },
    },
  ),
)
