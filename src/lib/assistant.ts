import type { Customer, Expense, Product, Sale } from './types'
import { DAY, fcfa, startOfDay } from './format'
import { restockSuggestions, summarize, topProducts } from './stats'

interface Data {
  products: Product[]
  sales: Sale[]
  expenses: Expense[]
  customers: Customer[]
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Assistant local basé sur des règles : il analyse les données du commerçant sans serveur. */
export function answer(question: string, d: Data): string {
  const q = norm(question)
  const today = startOfDay()
  const has = (...w: string[]) => w.some((x) => q.includes(x))

  if (has('recommand', 'reappro', 'commander', 'stock', 'manque', 'rupture')) {
    const list = restockSuggestions(d.products, d.sales)
    if (!list.length) return '✅ Tous vos stocks sont suffisants pour la semaine à venir.'
    return (
      'Voici les produits à réapprovisionner cette semaine :\n' +
      list
        .map((r) => {
          const days = Number.isFinite(r.daysLeft) ? `~${Math.max(1, Math.floor(r.daysLeft))} j de stock` : 'stock faible'
          return `• ${r.product.emoji} ${r.product.name} — ${r.product.qty} en stock (${days})` + (r.need ? ` → commander ~${r.need}` : '')
        })
        .join('\n')
    )
  }

  if (has('gagne', 'benefice', 'chiffre', 'ca ', 'combien', 'marge')) {
    const range = has('aujourd', 'jour') && !has('semaine') ? 0 : has('mois') ? 29 : 6
    const label = range === 0 ? "aujourd'hui" : range === 6 ? 'cette semaine' : 'ce mois'
    const s = summarize(d.sales, d.expenses, today - range * DAY)
    return `Sur ${label} : chiffre d'affaires ${fcfa(s.revenue)}, marge ${fcfa(s.margin)}, dépenses ${fcfa(s.expenses)}. Votre bénéfice estimé est de ${fcfa(s.profit)}.`
  }

  if (has('populaire', 'vendu', 'top', 'meilleur')) {
    const t = topProducts(d.sales, today - 6 * DAY, 3)
    if (!t.length) return "Pas encore de ventes cette semaine."
    return 'Vos produits les plus vendus (7 jours) :\n' + t.map((p, i) => `${['🥇', '🥈', '🥉'][i]} ${p.name} — ${p.qty} vendus`).join('\n')
  }

  if (has('credit', 'dette', 'doit')) {
    const debtors = d.customers.filter((c) => c.credit > 0)
    if (!debtors.length) return 'Aucun client ne vous doit d’argent 🎉'
    return 'Crédits en cours :\n' + debtors.map((c) => `• ${c.name} — ${fcfa(c.credit)}`).join('\n')
  }

  if (has('depense')) {
    const s = summarize(d.sales, d.expenses, today - 6 * DAY)
    return `Vos dépenses des 7 derniers jours s'élèvent à ${fcfa(s.expenses)}.`
  }

  return 'Je peux vous aider sur : les produits à recommander, votre chiffre d’affaires et bénéfice, vos meilleurs produits, les crédits clients et vos dépenses. Essayez une des suggestions ci-dessous.'
}
