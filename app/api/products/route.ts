import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteProductImage, uploadProductImage } from '@/lib/product-images'
import {
  ProductCreateSchema,
  PaginationParamsSchema,
  productPayloadFromFormData,
} from '@/lib/validations'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const q = searchParams.get('q') ?? ''

  const parsed = PaginationParamsSchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { page, limit } = parsed.data
  const skip = (page - 1) * limit
  const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : undefined

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return NextResponse.json({ data, total, page, limit, totalPages })
}

export async function POST(req: NextRequest) {
  const isMultipart = req.headers.get('content-type')?.includes('multipart/form-data')
  const formData = isMultipart ? await req.formData() : null
  const body = formData ? productPayloadFromFormData(formData) : await req.json()
  const parsed = ProductCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const file = formData?.get('file')
  let uploadedPhotoUrl: string | undefined

  try {
    if (file instanceof File && file.size > 0) {
      uploadedPhotoUrl = await uploadProductImage(file)
    }

    const product = await prisma.product.create({
      data: { ...parsed.data, photoUrl: uploadedPhotoUrl ?? parsed.data.photoUrl },
    })
    return NextResponse.json(product, { status: 201 })
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
