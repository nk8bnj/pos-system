import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteProductImage, uploadProductImage } from '@/lib/product-images'
import { ProductUpdateSchema, productPayloadFromFormData } from '@/lib/validations'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id: Number(id) } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const productId = Number(id)
  const isMultipart = req.headers.get('content-type')?.includes('multipart/form-data')
  const formData = isMultipart ? await req.formData() : null
  const body = formData ? productPayloadFromFormData(formData) : await req.json()
  const parsed = ProductUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const file = formData?.get('file')
  let uploadedPhotoUrl: string | undefined

  try {
    if (file instanceof File && file.size > 0) {
      uploadedPhotoUrl = await uploadProductImage(file)
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { ...parsed.data, photoUrl: uploadedPhotoUrl ?? parsed.data.photoUrl },
    })

    if (uploadedPhotoUrl && existing.photoUrl !== uploadedPhotoUrl) {
      await deleteProductImage(existing.photoUrl).catch((cleanupError) => {
        console.error('Failed to delete replaced product image', cleanupError)
      })
    }

    return NextResponse.json(product)
  } catch (e) {
    if (uploadedPhotoUrl) {
      await deleteProductImage(uploadedPhotoUrl).catch((cleanupError) => {
        console.error('Failed to clean up uploaded product image', cleanupError)
      })
    }

    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const numId = Number(id)
  const product = await prisma.product.findUnique({ where: { id: numId } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.saleItem.deleteMany({ where: { productId: numId } }),
    prisma.product.delete({ where: { id: numId } }),
  ])

  await deleteProductImage(product.photoUrl).catch((cleanupError) => {
    console.error('Failed to delete product image', cleanupError)
  })

  return NextResponse.json({ ok: true })
}
