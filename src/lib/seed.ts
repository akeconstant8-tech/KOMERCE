import type { Customer, Expense, Product, Sale } from './types'
import { DAY, startOfDay } from './format'

export const seedProducts: Product[] = [
  { id: 'p1', name: 'Coca-Cola 50cl', emoji: '🥤', buyPrice: 300, sellPrice: 500, qty: 18, alertThreshold: 5, category: 'Boissons', supplier: 'SOLIBRA' },
  { id: 'p2', name: 'Eau minérale 50cl', emoji: '💧', buyPrice: 150, sellPrice: 300, qty: 40, alertThreshold: 10, category: 'Boissons', supplier: 'Awa' },
  { id: 'p3', name: 'Pain', emoji: '🥖', buyPrice: 150, sellPrice: 300, qty: 25, alertThreshold: 8, category: 'Boulangerie', supplier: 'Boulangerie Centrale' },
  { id: 'p4', name: 'Riz 25kg', emoji: '🍚', buyPrice: 12500, sellPrice: 15000, qty: 6, alertThreshold: 5, category: 'Alimentation', supplier: 'Grossiste Adjamé' },
  { id: 'p5', name: 'Huile 5L', emoji: '🛢️', buyPrice: 4800, sellPrice: 5800, qty: 9, alertThreshold: 4, category: 'Alimentation', supplier: 'Grossiste Adjamé' },
  { id: 'p6', name: 'Sucre 1kg', emoji: '🍬', buyPrice: 600, sellPrice: 800, qty: 30, alertThreshold: 10, category: 'Alimentation', supplier: 'Grossiste Adjamé' },
  { id: 'p7', name: 'Savon', emoji: '🧼', buyPrice: 200, sellPrice: 350, qty: 4, alertThreshold: 6, category: 'Hygiène', supplier: 'Awa' },
]

export const seedCustomers: Customer[] = [
  { id: 'c1', name: 'Jean Kouassi', phone: '07 08 09 10 11', credit: 5000 },
  { id: 'c2', name: 'Awa Traoré', phone: '05 44 33 22 11', credit: 0 },
]

export function seedSales(): Sale[] {
  const sales: Sale[] = []
  const base = startOfDay()
  const pick = ['p4', 'p5', 'p6', 'p1', 'p2', 'p3', 'p7']
  let n = 1
  for (let d = 6; d >= 0; d--) {
    const count = 3 + ((d * 5) % 4)
    for (let i = 0; i < count; i++) {
      const p = seedProducts.find((x) => x.id === pick[(d + i * 2) % pick.length])!
      const qty = 1 + ((d + i) % 3)
      sales.push({
        id: `s${n}`,
        number: 1000 + n,
        date: base - d * DAY + (8 + i) * 3_600_000,
        items: [{ productId: p.id, name: p.name, qty, price: p.sellPrice, cost: p.buyPrice }],
        total: p.sellPrice * qty,
        profit: (p.sellPrice - p.buyPrice) * qty,
        customerId: i === 0 && d % 2 === 0 ? 'c1' : undefined,
        paid: p.sellPrice * qty,
      })
      n++
    }
  }
  sales.sort((a, b) => b.date - a.date)
  for (const s of sales.slice(0, 3)) s.status = 'En cours'
  return sales
}

export const seedExpenses: Expense[] = [
  { id: 'e1', date: Date.now() - 3_600_000, label: 'Transport marchandises', amount: 5000 },
  { id: 'e2', date: Date.now() - 2 * DAY, label: 'Électricité', amount: 18000 },
]
