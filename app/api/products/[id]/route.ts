import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProductUpdateSchema } from '@/lib/validations'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id: Number(id) } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const parsed = ProductUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: parsed.data,
  })
  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const numId = Number(id)
  await prisma.$transaction([
    prisma.saleItem.deleteMany({ where: { productId: numId } }),
    prisma.product.delete({ where: { id: numId } }),
  ])
  return NextResponse.json({ ok: true })
}
