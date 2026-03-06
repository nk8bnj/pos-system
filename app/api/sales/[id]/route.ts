import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const sale = await prisma.sale.findUnique({
    where: { id: Number(id) },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  })
  if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(sale)
}
