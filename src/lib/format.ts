const nf = new Intl.NumberFormat('fr-FR')
const clean = (s: string) => s.replace(/[  ]/g, ' ')
export const num = (n: number) => clean(nf.format(Math.round(n)))
export const fcfa = (n: number) => `${num(n)} FCFA`
export const uid = () => Math.random().toString(36).slice(2, 10)
export const startOfDay = (t = Date.now()) => new Date(t).setHours(0, 0, 0, 0)
export const DAY = 86_400_000
export const timeFr = (t: number) =>
  new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
