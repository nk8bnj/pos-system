export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import SaleDetail from './SaleDetail'
import AppHeader from '@/components/AppHeader'

export interface DayStat {
  date: string
  totalRevenue: number
  items: {
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }[]
}

export default async function ProdazhiPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: { select: { name: true } } } } },
  })

  const dayMap = new Map<string, DayStat>()

  for (const sale of sales) {
    const date = sale.createdAt.toLocaleDateString('sv-SE') // YYYY-MM-DD
    if (!dayMap.has(date)) {
      dayMap.set(date, { date, totalRevenue: 0, items: [] })
    }
    const day = dayMap.get(date)!
    for (const item of sale.items) {
      const unitPrice = parseFloat(item.price.toString())
      const qty = item.quantity
      day.totalRevenue += unitPrice * qty
      const existing = day.items.find((i) => i.productName === item.product.name)
      if (existing) {
        existing.quantity += qty
        existing.subtotal += unitPrice * qty
      } else {
        day.items.push({
          productName: item.product.name,
          quantity: qty,
          unitPrice,
          subtotal: unitPrice * qty,
        })
      }
    }
  }

  const days = Array.from(dayMap.values())

  return (
    <div>
      <AppHeader />
      <div className="p-4 md:p-6">
        <h1 className="mb-6 text-2xl font-bold">Продажі</h1>
        <SaleDetail days={days} />
      </div>
    </div>
  )
}
