import { describe, it, expect } from 'vitest'
import { PaginationParamsSchema } from '@/lib/validations'

describe('PaginationParamsSchema', () => {
  it('parses valid page and limit', () => {
    const result = PaginationParamsSchema.safeParse({ page: '3', limit: '20' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(20)
    }
  })

  it('defaults page to 1 when omitted', () => {
    const result = PaginationParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
    }
  })

  it('defaults limit to 50 when omitted', () => {
    const result = PaginationParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
    }
  })

  it('rejects page of 0', () => {
    const result = PaginationParamsSchema.safeParse({ page: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects negative page', () => {
    const result = PaginationParamsSchema.safeParse({ page: '-1' })
    expect(result.success).toBe(false)
  })

  it('rejects limit greater than 100', () => {
    const result = PaginationParamsSchema.safeParse({ limit: '101' })
    expect(result.success).toBe(false)
  })

  it('accepts limit of exactly 100', () => {
    const result = PaginationParamsSchema.safeParse({ limit: '100' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(100)
    }
  })

  it('accepts limit of exactly 1', () => {
    const result = PaginationParamsSchema.safeParse({ limit: '1' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(1)
    }
  })

  it('rejects limit of 0', () => {
    const result = PaginationParamsSchema.safeParse({ limit: '0' })
    expect(result.success).toBe(false)
  })

  it('coerces string numbers correctly', () => {
    const result = PaginationParamsSchema.safeParse({ page: '10', limit: '25' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(10)
      expect(result.data.limit).toBe(25)
    }
  })

  it('rejects non-numeric strings', () => {
    const result = PaginationParamsSchema.safeParse({ page: 'abc' })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer values', () => {
    const result = PaginationParamsSchema.safeParse({ page: '1.5' })
    expect(result.success).toBe(false)
  })
})
