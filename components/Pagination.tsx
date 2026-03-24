'use client'

import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  buildHref: (page: number) => string
}

function buildPageRange(current: number, total: number): (number | '...')[] {
  // Show all if 7 or fewer
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []

  // Always include page 1
  pages.push(1)

  const left = current - 1
  const right = current + 1

  // Ellipsis after page 1?
  if (left > 2) {
    pages.push('...')
  }

  // Neighbors around current
  for (let p = Math.max(2, left); p <= Math.min(total - 1, right); p++) {
    pages.push(p)
  }

  // Ellipsis before last page?
  if (right < total - 1) {
    pages.push('...')
  }

  // Always include last page
  pages.push(total)

  return pages
}

export default function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPageRange(currentPage, totalPages)

  const prevDisabled = currentPage <= 1
  const nextDisabled = currentPage >= totalPages

  return (
    <nav
      aria-label="Пагінація"
      className="mt-6 flex items-center justify-center gap-1"
    >
      <Link
        href={prevDisabled ? '#' : buildHref(currentPage - 1)}
        aria-label="Попередня сторінка"
        aria-disabled={prevDisabled || undefined}
        className={[
          'flex h-8 w-8 items-center justify-center rounded-lg border text-sm',
          prevDisabled
            ? 'cursor-not-allowed border-gray-200 text-gray-300'
            : 'border-gray-300 text-gray-600 hover:bg-orange-50 hover:border-orange-300',
        ].join(' ')}
        tabIndex={prevDisabled ? -1 : undefined}
        onClick={prevDisabled ? (e) => e.preventDefault() : undefined}
      >
        ‹
      </Link>

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-8 w-8 items-center justify-center text-sm text-gray-400"
          >
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium',
              p === currentPage
                ? 'border-orange-400 bg-orange-400 text-gray-800'
                : 'border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300',
            ].join(' ')}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={nextDisabled ? '#' : buildHref(currentPage + 1)}
        aria-label="Наступна сторінка"
        aria-disabled={nextDisabled || undefined}
        className={[
          'flex h-8 w-8 items-center justify-center rounded-lg border text-sm',
          nextDisabled
            ? 'cursor-not-allowed border-gray-200 text-gray-300'
            : 'border-gray-300 text-gray-600 hover:bg-orange-50 hover:border-orange-300',
        ].join(' ')}
        tabIndex={nextDisabled ? -1 : undefined}
        onClick={nextDisabled ? (e) => e.preventDefault() : undefined}
      >
        ›
      </Link>
    </nav>
  )
}
