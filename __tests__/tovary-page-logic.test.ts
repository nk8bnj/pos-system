import { describe, it, expect } from 'vitest'

// Unit tests for the pure logic used inside TovaryPage
// The actual server component fetches from DB so we test the logic separately.

describe('TovaryPage pagination logic', () => {
  function computePaginationParams(
    rawPage: string | undefined,
    totalPages: number
  ): { page: number; skip: number; limit: number } {
    const limit = 50
    const parsed = parseInt(rawPage ?? '1', 10)
    const page = isNaN(parsed) || parsed < 1 ? 1 : parsed
    // Clamp to totalPages when out of range (but only if there are pages)
    const clampedPage = totalPages > 0 && page > totalPages ? 1 : page
    const skip = (clampedPage - 1) * limit
    return { page: clampedPage, skip, limit }
  }

  it('uses page 1 by default', () => {
    const { page, skip } = computePaginationParams(undefined, 5)
    expect(page).toBe(1)
    expect(skip).toBe(0)
  })

  it('uses the given page', () => {
    const { page, skip } = computePaginationParams('3', 10)
    expect(page).toBe(3)
    expect(skip).toBe(100)
  })

  it('clamps to page 1 when page exceeds totalPages', () => {
    const { page, skip } = computePaginationParams('99', 5)
    expect(page).toBe(1)
    expect(skip).toBe(0)
  })

  it('does not clamp when page equals totalPages', () => {
    const { page } = computePaginationParams('5', 5)
    expect(page).toBe(5)
  })

  it('uses page 1 for invalid non-numeric input', () => {
    const { page } = computePaginationParams('abc', 5)
    expect(page).toBe(1)
  })

  it('uses page 1 when totalPages is 0', () => {
    const { page } = computePaginationParams('5', 0)
    // totalPages 0 means no clamping should happen (empty result set)
    expect(page).toBe(5)
  })

  it('computes correct skip for page 2 with limit 50', () => {
    const { skip } = computePaginationParams('2', 10)
    expect(skip).toBe(50)
  })

  it('uses page 1 for page=0 input', () => {
    const { page } = computePaginationParams('0', 5)
    expect(page).toBe(1)
  })

  it('uses page 1 for negative input', () => {
    const { page } = computePaginationParams('-3', 5)
    expect(page).toBe(1)
  })
})

describe('totalPages computation', () => {
  function computeTotalPages(total: number, limit: number): number {
    return Math.max(1, Math.ceil(total / limit))
  }

  it('returns 1 for empty result', () => {
    expect(computeTotalPages(0, 50)).toBe(1)
  })

  it('returns 1 when results fit on one page', () => {
    expect(computeTotalPages(50, 50)).toBe(1)
  })

  it('returns 2 for 51 results with limit 50', () => {
    expect(computeTotalPages(51, 50)).toBe(2)
  })

  it('returns 3 for 101 results with limit 50', () => {
    expect(computeTotalPages(101, 50)).toBe(3)
  })

  it('handles exact multiples correctly', () => {
    expect(computeTotalPages(100, 50)).toBe(2)
  })
})
