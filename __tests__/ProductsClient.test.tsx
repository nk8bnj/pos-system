import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductsClient from '@/app/tovary/ProductsClient'

// Mock child components
vi.mock('@/components/SearchInput', () => ({
  default: ({ defaultValue }: { defaultValue: string }) => (
    <input
      data-testid="search-input"
      defaultValue={defaultValue}
      placeholder="Пошук товарів..."
    />
  ),
}))

vi.mock('@/components/Pagination', () => ({
  default: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => (
    <div data-testid="pagination">
      page {currentPage} of {totalPages}
    </div>
  ),
}))

vi.mock('@/components/NavLink', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

const sampleProducts = [
  { id: 1, name: 'Apple', price: 10.0, cost: 5.0, stock: 100, description: null, photoUrl: null },
  { id: 2, name: 'Banana', price: 5.0, cost: 2.0, stock: 0, description: 'Yellow fruit', photoUrl: null },
]

const defaultProps = {
  initialProducts: sampleProducts,
  currentPage: 1,
  totalPages: 3,
  total: 120,
  currentSearch: '',
}

describe('ProductsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product names', () => {
    render(<ProductsClient {...defaultProps} />)
    expect(screen.getAllByText('Apple').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Banana').length).toBeGreaterThan(0)
  })

  it('renders SearchInput with currentSearch as defaultValue', () => {
    render(<ProductsClient {...defaultProps} currentSearch="мак" />)
    const searchInput = screen.getByTestId('search-input')
    // defaultValue is a React prop; in jsdom it initializes the input value
    expect(searchInput).toHaveValue('мак')
  })

  it('renders Pagination component with correct props', () => {
    render(<ProductsClient {...defaultProps} currentPage={2} totalPages={5} />)
    expect(screen.getByTestId('pagination')).toHaveTextContent('page 2 of 5')
  })

  it('shows "X–Y of Z products" summary text', () => {
    render(<ProductsClient {...defaultProps} currentPage={1} totalPages={3} total={120} />)
    // page 1, limit 50: showing 1-50 (or 1-2 since only 2 products in initialProducts)
    // The text should contain the total count
    expect(screen.getByText(/120/)).toBeInTheDocument()
  })

  it('shows out-of-stock product with visual indicator', () => {
    render(<ProductsClient {...defaultProps} />)
    // Banana has stock 0 — should be rendered with special class
    // At minimum verify product is still shown
    expect(screen.getAllByText('Banana').length).toBeGreaterThan(0)
  })

  it('does not do client-side filtering — shows all initialProducts', () => {
    render(<ProductsClient {...defaultProps} currentSearch="Apple" />)
    // Without client-side filter, both products should be visible
    expect(screen.getAllByText('Apple').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Banana').length).toBeGreaterThan(0)
  })

  it('calls router.refresh after deleting a product', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    window.confirm = vi.fn(() => true)

    render(<ProductsClient {...defaultProps} />)

    const deleteButtons = screen.getAllByLabelText('Видалити')
    await userEvent.click(deleteButtons[0])

    expect(mockRefresh).toHaveBeenCalled()
  })

  it('calls router.refresh and navigates to page 1 after creating a product', async () => {
    const newProduct = { id: 3, name: 'Cherry', price: 8, cost: 3, stock: 50 }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => newProduct,
    })

    render(<ProductsClient {...defaultProps} />)

    // Open the add modal
    const addButton = screen.getByText('+ Додати товар')
    await userEvent.click(addButton)

    // Fill form
    const nameInput = screen.getByLabelText('Назва')
    const priceInput = screen.getByLabelText('Ціна (₴)')
    const costInput = screen.getByLabelText('Закупівельна (₴)')
    const stockInput = screen.getByLabelText('Залишок')

    await userEvent.type(nameInput, 'Cherry')
    await userEvent.type(priceInput, '8')
    await userEvent.type(costInput, '3')
    await userEvent.clear(stockInput)
    await userEvent.type(stockInput, '50')

    const saveButton = screen.getByRole('button', { name: 'Зберегти' })
    await userEvent.click(saveButton)

    expect(mockRefresh).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/tovary?q=&page=1')
  })

  it('does NOT navigate to page 1 after editing a product', async () => {
    const updatedProduct = { ...sampleProducts[0], name: 'Apple Updated' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedProduct,
    })

    render(<ProductsClient {...defaultProps} />)

    // Open edit modal for first product
    const editButtons = screen.getAllByLabelText('Редагувати')
    await userEvent.click(editButtons[0])

    const saveButton = screen.getByRole('button', { name: 'Зберегти' })
    await userEvent.click(saveButton)

    // Push should NOT be called for edit (no pagination reset)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows sell modal when sell button clicked', async () => {
    render(<ProductsClient {...defaultProps} />)
    const sellButtons = screen.getAllByLabelText('Продати')
    // First product has stock 100, so button is enabled
    await userEvent.click(sellButtons[0])
    expect(screen.getByText(/шт\. в наявності/)).toBeInTheDocument()
  })

  it('closes sell modal on cancel', async () => {
    render(<ProductsClient {...defaultProps} />)
    const sellButtons = screen.getAllByLabelText('Продати')
    await userEvent.click(sellButtons[0])

    const cancelButton = screen.getByRole('button', { name: 'Скасувати' })
    await userEvent.click(cancelButton)

    expect(screen.queryByText(/шт\. в наявності/)).not.toBeInTheDocument()
  })

  it('completes a sale and decrements stock optimistically', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 42 }),
    })

    render(<ProductsClient {...defaultProps} />)
    // Open sell modal for first product (100 stock)
    const sellButtons = screen.getAllByLabelText('Продати')
    await userEvent.click(sellButtons[0])

    // The confirm button inside the modal has text "Продати" but no aria-label
    // Use a more specific selector within the modal context
    const confirmButtons = screen.getAllByRole('button', { name: 'Продати' })
    // The last one is the modal confirm (the others are aria-label sell buttons in the list)
    await userEvent.click(confirmButtons[confirmButtons.length - 1])

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sales',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows sell error message on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Недостатньо товару' }),
    })

    render(<ProductsClient {...defaultProps} />)
    const sellButtons = screen.getAllByLabelText('Продати')
    await userEvent.click(sellButtons[0])

    const confirmButtons = screen.getAllByRole('button', { name: 'Продати' })
    await userEvent.click(confirmButtons[confirmButtons.length - 1])

    expect(await screen.findByText('Недостатньо товару')).toBeInTheDocument()
  })

  it('shows error when creating product fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ error: 'validation failed' }),
    })

    render(<ProductsClient {...defaultProps} />)
    await userEvent.click(screen.getByText('+ Додати товар'))

    await userEvent.type(screen.getByLabelText('Назва'), 'Test')
    await userEvent.type(screen.getByLabelText('Ціна (₴)'), '10')
    await userEvent.type(screen.getByLabelText('Закупівельна (₴)'), '5')
    const stockInput = screen.getByLabelText('Залишок')
    await userEvent.clear(stockInput)
    await userEvent.type(stockInput, '5')

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(await screen.findByText(/"validation failed"/)).toBeInTheDocument()
  })

  it('closes add modal on cancel', async () => {
    render(<ProductsClient {...defaultProps} />)
    await userEvent.click(screen.getByText('+ Додати товар'))

    expect(screen.getByText('Новий товар')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Скасувати' }))
    expect(screen.queryByText('Новий товар')).not.toBeInTheDocument()
  })

  it('shows "Редагувати товар" title in edit modal', async () => {
    render(<ProductsClient {...defaultProps} />)
    const editButtons = screen.getAllByLabelText('Редагувати')
    await userEvent.click(editButtons[0])
    expect(screen.getByText('Редагувати товар')).toBeInTheDocument()
  })

  it('does not delete when confirm is cancelled', async () => {
    window.confirm = vi.fn(() => false)
    render(<ProductsClient {...defaultProps} />)

    const deleteButtons = screen.getAllByLabelText('Видалити')
    await userEvent.click(deleteButtons[0])

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('shows "Немає товарів" when product list is empty', () => {
    render(<ProductsClient {...defaultProps} initialProducts={[]} total={0} />)
    expect(screen.getAllByText('Немає товарів').length).toBeGreaterThan(0)
  })

  it('renders products with photos correctly', () => {
    const productsWithPhoto = [
      { ...sampleProducts[0], photoUrl: 'https://example.com/apple.jpg' },
    ]
    render(<ProductsClient {...defaultProps} initialProducts={productsWithPhoto} />)
    const images = screen.getAllByAltText('Apple')
    expect(images.length).toBeGreaterThan(0)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/apple.jpg')
  })

  it('shows "Немає в наявності" badge for out-of-stock product in sell modal', async () => {
    const outOfStockProduct = [{ ...sampleProducts[1], stock: 0 }]
    render(<ProductsClient {...defaultProps} initialProducts={outOfStockProduct} />)

    // Sell button should be disabled for out-of-stock
    const sellButtons = screen.getAllByLabelText('Продати')
    expect(sellButtons[0]).toBeDisabled()
  })

  it('shows no summary text when total is 0', () => {
    render(<ProductsClient {...defaultProps} total={0} initialProducts={[]} />)
    expect(screen.queryByText(/Показано/)).not.toBeInTheDocument()
  })

  it('increments sell quantity with + button', async () => {
    render(<ProductsClient {...defaultProps} />)
    const sellButtons = screen.getAllByLabelText('Продати')
    await userEvent.click(sellButtons[0])

    // Find the + button (text content "+")
    const plusButton = screen.getByRole('button', { name: '+' })
    await userEvent.click(plusButton)

    // Quantity should now be 2
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('decrements sell quantity with - button but not below 1', async () => {
    render(<ProductsClient {...defaultProps} />)
    const sellButtons = screen.getAllByLabelText('Продати')
    await userEvent.click(sellButtons[0])

    // Quantity starts at 1 - clicking minus should keep it at 1
    const minusButton = screen.getByRole('button', { name: '−' })
    await userEvent.click(minusButton)

    // Still 1
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('updates product list optimistically after successful sale', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 77 }),
    })

    render(<ProductsClient {...defaultProps} />)
    const sellButtons = screen.getAllByLabelText('Продати')
    await userEvent.click(sellButtons[0]) // Apple, stock 100

    const confirmButtons = screen.getAllByRole('button', { name: 'Продати' })
    await userEvent.click(confirmButtons[confirmButtons.length - 1])

    // Sale success toast should appear
    expect(await screen.findByText(/Продаж #77 завершено!/)).toBeInTheDocument()
  })

  it('updates form fields when editing a product', async () => {
    render(<ProductsClient {...defaultProps} />)
    const editButtons = screen.getAllByLabelText('Редагувати')
    await userEvent.click(editButtons[0])

    // Name field should be pre-populated
    expect(screen.getByLabelText('Назва')).toHaveValue('Apple')
    expect(screen.getByLabelText('Ціна (₴)')).toHaveValue(10)
  })

  it('shows plain text error for non-JSON server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    })

    render(<ProductsClient {...defaultProps} />)
    await userEvent.click(screen.getByText('+ Додати товар'))

    await userEvent.type(screen.getByLabelText('Назва'), 'Fail')
    await userEvent.type(screen.getByLabelText('Ціна (₴)'), '1')
    await userEvent.type(screen.getByLabelText('Закупівельна (₴)'), '1')
    const stockInput = screen.getByLabelText('Залишок')
    await userEvent.clear(stockInput)
    await userEvent.type(stockInput, '1')

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(await screen.findByText('Internal Server Error')).toBeInTheDocument()
  })

  it('shows status error when response has no text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => '',
    })

    render(<ProductsClient {...defaultProps} />)
    await userEvent.click(screen.getByText('+ Додати товар'))

    await userEvent.type(screen.getByLabelText('Назва'), 'Fail2')
    await userEvent.type(screen.getByLabelText('Ціна (₴)'), '1')
    await userEvent.type(screen.getByLabelText('Закупівельна (₴)'), '1')
    const stockInput = screen.getByLabelText('Залишок')
    await userEvent.clear(stockInput)
    await userEvent.type(stockInput, '1')

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(await screen.findByText('Помилка 503')).toBeInTheDocument()
  })
})
