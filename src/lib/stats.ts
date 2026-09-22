import type { Expense, Product, Sale } from './types'
import { DAY, startOfDay } from './format'

export function summarize(sales: Sale[], expenses: Expense[], from: number, to = Infinity) {
  const s = sales.filter((x) => x.date >= from && x.date < to)
  const e = expenses.filter((x) => x.date >= from && x.date < to)
  const revenue = s.reduce((a, x) => a + x.total, 0)
  const margin = s.reduce((a, x) => a + x.profit, 0)
  const spent = e.reduce((a, x) => a + x.amount, 0)
  return { count: s.length, revenue, margin, expenses: spent, profit: margin - spent }
}

export function dailySeries(sales: Sale[], days = 7) {
  const today = startOfDay()
  return Array.from({ length: days }, (_, i) => {
    const d = today - (days - 1 - i) * DAY
    const ca = sales.filter((s) => s.date >= d && s.date < d + DAY).reduce((a, s) => a + s.total, 0)
    const label =
      days <= 7
        ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' })
        : new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    return { label, ca, count: sales.filter((s) => s.date >= d && s.date < d + DAY).length }
  })
}

export function topProducts(sales: Sale[], from = 0, limit = 5) {
  const m = new Map<string, { id: string; name: string; qty: number; revenue: number }>()
  for (const s of sales) {
    if (s.date < from) continue
    for (const i of s.items) {
      const cur = m.get(i.productId) ?? { id: i.productId, name: i.name, qty: 0, revenue: 0 }
      cur.qty += i.qty
      cur.revenue += i.qty * i.price
      m.set(i.productId, cur)
    }
  }
  return [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, limit)
}

/** Produits dont le stock couvre moins de `horizon` jours au rythme des 7 derniers jours. */
export function restockSuggestions(products: Product[], sales: Sale[], horizon = 7) {
  const from = startOfDay() - 6 * DAY
  const sold = new Map<string, number>()
  for (const s of sales)
    if (s.date >= from) for (const i of s.items) sold.set(i.productId, (sold.get(i.productId) ?? 0) + i.qty)
  return products
    .map((p) => {
      const week = sold.get(p.id) ?? 0
      const perDay = week / 7
      const daysLeft = perDay > 0 ? p.qty / perDay : Infinity
      const need = Math.max(0, Math.ceil(perDay * horizon) - p.qty)
      return { product: p, week, daysLeft, need }
    })
    .filter((r) => r.product.qty <= r.product.alertThreshold || r.daysLeft < horizon)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}
