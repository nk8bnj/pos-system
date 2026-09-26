import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SaleDetail, { groupDaysByYearAndMonth } from '@/app/prodazhi/SaleDetail'
import type { DayStat } from '@/app/prodazhi/page'

const days: DayStat[] = [
  {
    date: '2026-09-11',
    totalRevenue: 125,
    items: [
      { productName: 'Apple', quantity: 2, unitPrice: 50, subtotal: 100 },
      { productName: 'Banana', quantity: 1, unitPrice: 25, subtotal: 25 },
    ],
  },
  {
    date: '2026-08-31',
    totalRevenue: 80,
    items: [{ productName: 'Pear', quantity: 2, unitPrice: 40, subtotal: 80 }],
  },
  {
    date: '2025-12-20',
    totalRevenue: 60,
    items: [{ productName: 'Orange', quantity: 1, unitPrice: 60, subtotal: 60 }],
  },
]

describe('groupDaysByYearAndMonth', () => {
  it('groups days and calculates totals for years and months', () => {
    const groups = groupDaysByYearAndMonth(days)

    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({
      key: '2026',
      totalQuantity: 5,
      totalRevenue: 205,
    })
    expect(groups[0].months.map((month) => month.key)).toEqual(['2026-09', '2026-08'])
    expect(groups[0].months[0]).toMatchObject({
      totalQuantity: 3,
      totalRevenue: 125,
    })
  })
})

describe('SaleDetail', () => {
  it('opens the newest year and month and keeps older periods collapsed', () => {
    render(<SaleDetail days={days} />)

    expect(screen.getByRole('button', { name: /2026 2 місяці/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Вересень 1 день/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('11 вересня 2026 р.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Серпень 1 день/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('31 серпня 2026 р.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2025 1 місяць/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Грудень')).not.toBeInTheDocument()
  })

  it('expands a month and then a day to show sale details', async () => {
    const user = userEvent.setup()
    render(<SaleDetail days={days} />)

    await user.click(screen.getByRole('button', { name: /Серпень 1 день/ }))
    const dayButton = screen.getByRole('button', { name: /31 серпня 2026 р./ })
    expect(dayButton).toBeInTheDocument()
    expect(screen.queryByText('Pear')).not.toBeInTheDocument()

    await user.click(dayButton)
    expect(screen.getByText('Pear')).toBeInTheDocument()
  })

  it('shows an empty state when there are no sales', () => {
    render(<SaleDetail days={[]} />)
    expect(screen.getByText('Ще немає продажів.')).toBeInTheDocument()
  })
})
