export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import ProductsClient from './ProductsClient'

const PAGE_LIMIT = 50

interface TovaryPageProps {
  searchParams: Promise<{ page?: string; q?: string }>
}

export default async function TovaryPage({ searchParams }: TovaryPageProps) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''

  // Parse and validate page number
  const rawPage = parseInt(params.page ?? '1', 10)
  const requestedPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : undefined

  // First pass: get total count with tentative page
  const total = await prisma.product.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  // Clamp page if out of range (e.g. user types ?page=999)
  const page = total > 0 && requestedPage > totalPages ? 1 : requestedPage
  const skip = (page - 1) * PAGE_LIMIT

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: PAGE_LIMIT,
  })

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: parseFloat(p.price.toString()),
    cost: parseFloat(p.cost.toString()),
    stock: p.stock,
    description: p.description,
    photoUrl: p.photoUrl,
  }))

  return (
    <ProductsClient
      key={`${page}-${q}`}
      initialProducts={serialized}
      currentPage={page}
      totalPages={totalPages}
      total={total}
      currentSearch={q}
    />
  )
}
