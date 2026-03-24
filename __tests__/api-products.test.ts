import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Prisma before importing the route
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { GET, POST } from '@/app/api/products/route'
import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as {
  product: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
}

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(url, options)
}

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated response with default page=1 limit=50', async () => {
    const fakeProducts = [{ id: 1, name: 'Apple', price: 10, cost: 5, stock: 100 }]
    mockPrisma.product.findMany.mockResolvedValue(fakeProducts)
    mockPrisma.product.count.mockResolvedValue(1)

    const req = makeRequest('http://localhost/api/products')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      data: fakeProducts,
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    })
  })

  it('passes skip and take to findMany based on page and limit', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(120)

    const req = makeRequest('http://localhost/api/products?page=3&limit=20')
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 })
    )
  })

  it('passes search query to where clause in both count and findMany', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const req = makeRequest('http://localhost/api/products?q=apple')
    await GET(req)

    const expectedWhere = { name: { contains: 'apple', mode: 'insensitive' } }
    expect(mockPrisma.product.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere })
    )
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere })
    )
  })

  it('calculates totalPages correctly', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(101)

    const req = makeRequest('http://localhost/api/products?limit=50')
    const res = await GET(req)
    const body = await res.json()

    expect(body.totalPages).toBe(3)
  })

  it('returns totalPages=1 when total is 0', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const req = makeRequest('http://localhost/api/products')
    const res = await GET(req)
    const body = await res.json()

    expect(body.totalPages).toBe(1)
  })

  it('returns totalPages=1 when results fit in one page', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(50)

    const req = makeRequest('http://localhost/api/products?limit=50')
    const res = await GET(req)
    const body = await res.json()

    expect(body.totalPages).toBe(1)
  })

  it('rejects page=0 with 400', async () => {
    const req = makeRequest('http://localhost/api/products?page=0')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('rejects limit=200 with 400', async () => {
    const req = makeRequest('http://localhost/api/products?limit=200')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('does not pass where clause when no search query', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const req = makeRequest('http://localhost/api/products')
    await GET(req)

    expect(mockPrisma.product.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })

  it('returns correct page and limit in response', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(200)

    const req = makeRequest('http://localhost/api/products?page=2&limit=30')
    const res = await GET(req)
    const body = await res.json()

    expect(body.page).toBe(2)
    expect(body.limit).toBe(30)
  })
})

describe('POST /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a product with valid data', async () => {
    const created = { id: 1, name: 'Test', price: 10, cost: 5, stock: 10 }
    mockPrisma.product.create.mockResolvedValue(created)

    const req = makeRequest('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', price: 10, cost: 5, stock: 10 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe(1)
  })

  it('returns 400 for invalid product data', async () => {
    const req = makeRequest('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify({ name: '', price: -1 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
