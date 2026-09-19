import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    saleItem: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/product-images', () => ({
  uploadProductImage: vi.fn(),
  deleteProductImage: vi.fn(),
}))

import { DELETE, PUT } from '@/app/api/products/[id]/route'
import { prisma } from '@/lib/prisma'
import { deleteProductImage, uploadProductImage } from '@/lib/product-images'

const mockPrisma = prisma as unknown as {
  product: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  saleItem: { deleteMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

const mockUploadProductImage = vi.mocked(uploadProductImage)
const mockDeleteProductImage = vi.mocked(deleteProductImage)
const params = { params: Promise.resolve({ id: '1' }) }

function makeMultipartRequest(formData: FormData) {
  return {
    headers: new Headers({ 'content-type': 'multipart/form-data; boundary=test' }),
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as NextRequest
}

describe('/api/products/[id] image lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteProductImage.mockResolvedValue(undefined)
  })

  it('deletes the previous image after replacing it successfully', async () => {
    const oldPhotoUrl = 'https://project.supabase.co/storage/v1/object/public/product-images/old.webp'
    const newPhotoUrl = 'https://project.supabase.co/storage/v1/object/public/product-images/new.webp'
    mockPrisma.product.findUnique.mockResolvedValue({ id: 1, photoUrl: oldPhotoUrl })
    mockUploadProductImage.mockResolvedValue(newPhotoUrl)
    mockPrisma.product.update.mockResolvedValue({ id: 1, name: 'Test', photoUrl: newPhotoUrl })

    const formData = new FormData()
    formData.append('name', 'Test')
    formData.append('price', '10')
    formData.append('cost', '5')
    formData.append('stock', '10')
    formData.append('photoUrl', oldPhotoUrl)
    formData.append('file', new File(['image'], 'new.jpg', { type: 'image/jpeg' }))

    const res = await PUT(makeMultipartRequest(formData), params)

    expect(res.status).toBe(200)
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ photoUrl: newPhotoUrl }),
    })
    expect(mockDeleteProductImage).toHaveBeenCalledWith(oldPhotoUrl)
  })

  it('deletes the stored image after deleting a product', async () => {
    const photoUrl = 'https://project.supabase.co/storage/v1/object/public/product-images/photo.webp'
    mockPrisma.product.findUnique.mockResolvedValue({ id: 1, photoUrl })
    mockPrisma.saleItem.deleteMany.mockReturnValue(Promise.resolve({ count: 0 }))
    mockPrisma.product.delete.mockReturnValue(Promise.resolve({ id: 1 }))
    mockPrisma.$transaction.mockResolvedValue([])

    const res = await DELETE(new NextRequest('http://localhost/api/products/1'), params)

    expect(res.status).toBe(200)
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
    expect(mockDeleteProductImage).toHaveBeenCalledWith(photoUrl)
  })
})
