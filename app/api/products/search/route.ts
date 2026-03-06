import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    take: 10,
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products)
}
