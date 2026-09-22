import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Customer, Expense, OrderStatus, Product, Sale, SaleItem } from './types'
import { seedCustomers, seedExpenses, seedProducts, seedSales } from './seed'
import { uid } from './format'
import { firebaseEnabled } from './firebase'

type Data = Pick<State, 'products' | 'customers' | 'sales' | 'expenses'>

// En mode Firebase, les données viennent de Firestore : rien n'est conservé dans localStorage.
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }

interface State {
  products: Product[]
  customers: Customer[]
  sales: Sale[]
  expenses: Expense[]
  lastSale: Sale | null
  hydrate: (data: Partial<Data>) => void
  clearAll: () => void
  saveProduct: (p: Omit<Product, 'id'> & { id?: string }) => void
  deleteProduct: (id: string) => void
  saveCustomer: (c: Omit<Customer, 'id' | 'credit'> & { id?: string }) => void
  deleteCustomer: (id: string) => void
  deleteExpense: (id: string) => void
  payCredit: (customerId: string, amount: number) => void
  addExpense: (label: string, amount: number) => void
  checkout: (cart: { productId: string; qty: number }[], customerId?: string, paid?: number, status?: OrderStatus) => Sale | null
  setSaleStatus: (id: string, status: OrderStatus) => void
  clearLastSale: () => void
  resetDemo: () => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      products: firebaseEnabled ? [] : seedProducts,
      customers: firebaseEnabled ? [] : seedCustomers,
      sales: firebaseEnabled ? [] : seedSales(),
      expenses: firebaseEnabled ? [] : seedExpenses,
      lastSale: null,

      hydrate: (data) => set(data),
      clearAll: () => set({ products: [], customers: [], sales: [], expenses: [], lastSale: null }),

      saveProduct: (p) =>
        set((s) => ({
          products: p.id
            ? s.products.map((x) => (x.id === p.id ? ({ ...x, ...p } as Product) : x))
            : [...s.products, { ...p, id: uid() } as Product],
        })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),

      saveCustomer: (c) =>
        set((s) => ({
          customers: c.id
            ? s.customers.map((x) => (x.id === c.id ? { ...x, ...c } : x))
            : [...s.customers, { ...c, id: uid(), credit: 0 }],
        })),
      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      payCredit: (id, amount) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, credit: Math.max(0, c.credit - amount) } : c)),
        })),

      addExpense: (label, amount) =>
        set((s) => ({ expenses: [{ id: uid(), date: Date.now(), label, amount }, ...s.expenses] })),

      setSaleStatus: (id, status) => set((s) => ({ sales: s.sales.map((x) => (x.id === id ? { ...x, status } : x)) })),

      checkout: (cart, customerId, paid, status) => {
        const { products, sales } = get()
        const items: SaleItem[] = []
        for (const line of cart) {
          const p = products.find((x) => x.id === line.productId)
          if (!p || line.qty <= 0 || line.qty > p.qty) return null
          items.push({ productId: p.id, name: p.name, qty: line.qty, price: p.sellPrice, cost: p.buyPrice })
        }
        if (!items.length) return null
        const total = items.reduce((a, i) => a + i.price * i.qty, 0)
        const profit = items.reduce((a, i) => a + (i.price - i.cost) * i.qty, 0)
        const amountPaid = customerId ? Math.min(total, paid ?? total) : total
        const sale: Sale = {
          id: uid(),
          number: Math.max(1000, ...sales.map((x) => x.number)) + 1,
          date: Date.now(),
          items,
          total,
          profit,
          customerId,
          paid: amountPaid,
          status,
        }
        set((s) => ({
          sales: [sale, ...s.sales],
          lastSale: sale,
          products: s.products.map((p) => {
            const it = items.find((i) => i.productId === p.id)
            return it ? { ...p, qty: p.qty - it.qty } : p
          }),
          customers: s.customers.map((c) =>
            c.id === customerId ? { ...c, credit: c.credit + (total - amountPaid) } : c,
          ),
        }))
        return sale
      },
      clearLastSale: () => set({ lastSale: null }),
      resetDemo: () =>
        set({ products: seedProducts, customers: seedCustomers, sales: seedSales(), expenses: seedExpenses, lastSale: null }),
    }),
    {
      name: 'komerce-v1',
      storage: createJSONStorage(() => (firebaseEnabled ? noopStorage : localStorage)),
      partialize: (s) => ({ ...s, lastSale: null }),
    },
  ),
)
