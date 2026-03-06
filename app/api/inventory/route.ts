import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InventoryUpdateSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = InventoryUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { productId, quantity } = parsed.data
  const product = await prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: quantity } },
  })
  return NextResponse.json(product)
}
