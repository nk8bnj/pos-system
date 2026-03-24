import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchInput from '@/components/SearchInput'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// useTransition mock - run startTransition callback synchronously
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useTransition: () => [false, (fn: () => void) => fn()],
  }
})

describe('SearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders an input with defaultValue', () => {
    render(<SearchInput defaultValue="apple" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('apple')
  })

  it('renders with empty defaultValue', () => {
    render(<SearchInput defaultValue="" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('')
  })

  it('renders with custom placeholder', () => {
    render(<SearchInput defaultValue="" placeholder="Знайти..." />)
    expect(screen.getByPlaceholderText('Знайти...')).toBeInTheDocument()
  })

  it('has a default placeholder', () => {
    render(<SearchInput defaultValue="" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder')
  })

  it('calls router.push with correct URL after debounce', () => {
    render(<SearchInput defaultValue="" />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'banana' } })

    // Should not have fired yet (debounce pending)
    expect(mockPush).not.toHaveBeenCalled()

    // Advance debounce timer
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(mockPush).toHaveBeenCalledWith('/tovary?q=banana&page=1')
  })

  it('does not fire router.push before debounce delay', () => {
    render(<SearchInput defaultValue="" />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'test' } })
    act(() => { vi.advanceTimersByTime(100) })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('fires only one router.push for rapid input (debounce)', () => {
    render(<SearchInput defaultValue="" />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'ab' } })
    act(() => { vi.advanceTimersByTime(100) })
    fireEvent.change(input, { target: { value: 'abc' } })
    act(() => { vi.advanceTimersByTime(300) })

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/tovary?q=abc&page=1')
  })

  it('URL-encodes special characters in search query', () => {
    render(<SearchInput defaultValue="" />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'café' } })
    act(() => { vi.advanceTimersByTime(300) })

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('caf%C3%A9')
    )
  })

  it('resets to page=1 on new search', () => {
    render(<SearchInput defaultValue="old" />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'new' } })
    act(() => { vi.advanceTimersByTime(300) })

    const call = mockPush.mock.calls[0][0]
    expect(call).toContain('page=1')
  })

  it('navigates with empty string when input is cleared', () => {
    render(<SearchInput defaultValue="something" />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: '' } })
    act(() => { vi.advanceTimersByTime(300) })

    expect(mockPush).toHaveBeenCalledWith('/tovary?q=&page=1')
  })
})
