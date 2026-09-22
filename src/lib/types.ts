export type OrderStatus = 'En cours' | 'Livrée'

export interface Product {
  id: string
  name: string
  emoji: string
  photo?: string
  buyPrice: number
  sellPrice: number
  qty: number
  alertThreshold: number
  category: string
  supplier: string
}

export interface SaleItem {
  productId: string
  name: string
  qty: number
  price: number
  cost: number
}

export interface Sale {
  id: string
  number: number
  date: number
  items: SaleItem[]
  total: number
  profit: number
  customerId?: string
  paid: number // montant réellement encaissé (total - crédit)
  status?: OrderStatus // absent = livrée
}

export interface Customer {
  id: string
  name: string
  phone: string
  credit: number
}

export interface Expense {
  id: string
  date: number
  label: string
  amount: number
}
