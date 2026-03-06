export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import SkladClient from './SkladClient'
import AppHeader from '@/components/AppHeader'

export default async function SkladPage() {
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
  return (
    <div>
      <AppHeader />
      <div className="p-4 md:p-6">
        <SkladClient products={products.map((p) => ({ id: p.id, name: p.name, stock: p.stock }))} />
      </div>
    </div>
  )
}
