import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { useStore } from './store'
import { useToasts } from './toast'

const COLS = ['products', 'customers', 'sales', 'expenses'] as const
type Col = (typeof COLS)[number]
type Row = { id: string; [k: string]: unknown }

const pick = (s: ReturnType<typeof useStore.getState>) => ({ products: s.products, customers: s.customers, sales: s.sales, expenses: s.expenses })

const sorters: Record<Col, (a: Row, b: Row) => number> = {
  products: (a, b) => String(a.name).localeCompare(String(b.name), 'fr'),
  customers: (a, b) => String(a.name).localeCompare(String(b.name), 'fr'),
  sales: (a, b) => Number(b.date) - Number(a.date),
  expenses: (a, b) => Number(b.date) - Number(a.date),
}

/**
 * Synchronise le store avec Firestore : users/{uid}/{products|customers|sales|expenses}/{id}.
 * - Firestore → store : à chaque changement distant (ou du cache local hors connexion).
 * - store → Firestore : seuls les éléments modifiés ou supprimés sont écrits.
 * Retourne une fonction d'arrêt qui vide aussi le store (pour ne pas mélanger deux comptes).
 */
export function startSync(uid: string, onReady: () => void): () => void {
  const database = db!
  let applying = false
  let prev = pick(useStore.getState())
  const ready = new Set<Col>()
  const remoteEmpty = new Set<Col>()

  const unsubSnaps = COLS.map((name) =>
    onSnapshot(
      collection(database, 'users', uid, name),
      (snap) => {
        const rows = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Row).sort(sorters[name])
        applying = true
        useStore.getState().hydrate({ [name]: rows })
        applying = false
        prev = pick(useStore.getState())
        if (rows.length === 0) remoteEmpty.add(name)
        else remoteEmpty.delete(name)
        if (!ready.has(name)) {
          ready.add(name)
          if (ready.size === COLS.length) {
            offerLocalImport(remoteEmpty.size === COLS.length)
            onReady()
          }
        }
      },
      () => useToasts.getState().push('Synchronisation impossible pour le moment', 'warn'),
    ),
  )

  const unsubStore = useStore.subscribe((state) => {
    if (applying) return
    const next = pick(state)
    const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = []
    for (const name of COLS) {
      if (next[name] === prev[name]) continue
      const before = new Map((prev[name] as unknown as Row[]).map((x) => [x.id, x]))
      const after = new Map((next[name] as unknown as Row[]).map((x) => [x.id, x]))
      for (const [id, item] of after) if (before.get(id) !== item) ops.push((b) => b.set(doc(database, 'users', uid, name, id), item))
      for (const id of before.keys()) if (!after.has(id)) ops.push((b) => b.delete(doc(database, 'users', uid, name, id)))
    }
    prev = next
    for (let i = 0; i < ops.length; i += 400) {
      const batch = writeBatch(database)
      ops.slice(i, i + 400).forEach((op) => op(batch))
      batch.commit().catch(() => useToasts.getState().push("Une modification n'a pas pu être enregistrée", 'warn'))
    }
  })

  return () => {
    unsubSnaps.forEach((u) => u())
    unsubStore()
    useStore.getState().clearAll()
  }
}

/** Compte neuf + données déjà présentes sur cet appareil (ancienne version locale) : proposer de les importer. */
function offerLocalImport(cloudIsEmpty: boolean) {
  if (!cloudIsEmpty) return
  try {
    const raw = localStorage.getItem('komerce-v1')
    if (!raw) return
    const local = JSON.parse(raw)?.state
    if (!local?.products?.length) return
    if (confirm('Des données existent sur cet appareil (produits, ventes, clients). Les importer dans votre compte ?')) {
      const { products = [], customers = [], sales = [], expenses = [] } = local
      useStore.getState().hydrate({ products, customers, sales, expenses })
    }
    localStorage.removeItem('komerce-v1')
  } catch {
    /* données locales illisibles : on les ignore */
  }
}
