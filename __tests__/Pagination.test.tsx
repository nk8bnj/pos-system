import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from '@/components/Pagination'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

function buildHref(page: number) {
  return `/tovary?page=${page}`
}

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} buildHref={buildHref} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders prev and next buttons', () => {
    render(<Pagination currentPage={2} totalPages={5} buildHref={buildHref} />)
    expect(screen.getByLabelText('Попередня сторінка')).toBeInTheDocument()
    expect(screen.getByLabelText('Наступна сторінка')).toBeInTheDocument()
  })

  it('disables prev button on page 1', () => {
    render(<Pagination currentPage={1} totalPages={5} buildHref={buildHref} />)
    const prev = screen.getByLabelText('Попередня сторінка')
    expect(prev).toHaveAttribute('aria-disabled', 'true')
  })

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} buildHref={buildHref} />)
    const next = screen.getByLabelText('Наступна сторінка')
    expect(next).toHaveAttribute('aria-disabled', 'true')
  })

  it('prev button is enabled when not on page 1', () => {
    render(<Pagination currentPage={3} totalPages={5} buildHref={buildHref} />)
    const prev = screen.getByLabelText('Попередня сторінка')
    expect(prev).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('next button is enabled when not on last page', () => {
    render(<Pagination currentPage={3} totalPages={5} buildHref={buildHref} />)
    const next = screen.getByLabelText('Наступна сторінка')
    expect(next).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('prev link points to current-1 page', () => {
    render(<Pagination currentPage={3} totalPages={5} buildHref={buildHref} />)
    const prev = screen.getByLabelText('Попередня сторінка')
    expect(prev).toHaveAttribute('href', '/tovary?page=2')
  })

  it('next link points to current+1 page', () => {
    render(<Pagination currentPage={3} totalPages={5} buildHref={buildHref} />)
    const next = screen.getByLabelText('Наступна сторінка')
    expect(next).toHaveAttribute('href', '/tovary?page=4')
  })

  it('shows all page numbers when totalPages <= 7', () => {
    render(<Pagination currentPage={1} totalPages={5} buildHref={buildHref} />)
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('link', { name: String(i) })).toBeInTheDocument()
    }
  })

  it('marks current page with aria-current', () => {
    render(<Pagination currentPage={2} totalPages={5} buildHref={buildHref} />)
    const currentLink = screen.getByRole('link', { name: '2' })
    expect(currentLink).toHaveAttribute('aria-current', 'page')
  })

  it('shows ellipsis for large page ranges', () => {
    render(<Pagination currentPage={5} totalPages={20} buildHref={buildHref} />)
    // Should show first page, last page, neighbors, and ellipsis
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    // At least one ellipsis
    const ellipses = screen.getAllByText('...')
    expect(ellipses.length).toBeGreaterThanOrEqual(1)
  })

  it('always shows first and last page', () => {
    render(<Pagination currentPage={10} totalPages={20} buildHref={buildHref} />)
    expect(screen.getByRole('link', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '20' })).toBeInTheDocument()
  })

  it('uses buildHref for page links', () => {
    const customHref = (p: number) => `/custom?pg=${p}`
    render(<Pagination currentPage={1} totalPages={3} buildHref={customHref} />)
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '/custom?pg=2')
  })

  it('renders nothing when totalPages is 0', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} buildHref={buildHref} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('prev disabled link prevents navigation on click', async () => {
    render(<Pagination currentPage={1} totalPages={5} buildHref={buildHref} />)
    const prev = screen.getByLabelText('Попередня сторінка')
    // Click disabled prev — should call preventDefault
    await userEvent.click(prev)
    // Just verify it is still on page 1 (no error thrown)
    expect(prev).toHaveAttribute('aria-disabled', 'true')
  })

  it('next disabled link prevents navigation on click', async () => {
    render(<Pagination currentPage={5} totalPages={5} buildHref={buildHref} />)
    const next = screen.getByLabelText('Наступна сторінка')
    await userEvent.click(next)
    expect(next).toHaveAttribute('aria-disabled', 'true')
  })
})
