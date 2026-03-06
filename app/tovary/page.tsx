export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import ProductsClient from './ProductsClient'

export default async function TovaryPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: parseFloat(p.price.toString()),
    cost: parseFloat(p.cost.toString()),
    stock: p.stock,
    description: p.description,
    photoUrl: p.photoUrl,
  }))
  return <ProductsClient initialProducts={serialized} />
}
