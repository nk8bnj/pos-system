import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SaleCreateSchema } from '@/lib/validations'

export async function GET() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(sales)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = SaleCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { items } = parsed.data

  const sale = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } })
      if (!product || product.stock < item.quantity) {
        throw new Error('Недостатньо товару на складі')
      }
    }

    const newSale = await tx.sale.create({
      data: {
        total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
        },
      },
    })

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return newSale
  })

  return NextResponse.json(sale, { status: 201 })
}
