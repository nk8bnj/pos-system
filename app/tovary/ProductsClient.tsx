'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

import NavLink from '@/components/NavLink'
import Pagination from '@/components/Pagination'
import SearchInput from '@/components/SearchInput'

interface Product {
  id: number
  name: string
  price: number
  cost: number
  stock: number
  description?: string | null
  photoUrl?: string | null
}

interface FormState {
  name: string
  price: string
  cost: string
  stock: string
  description: string
  photoUrl: string
}

interface ProductsClientProps {
  initialProducts: Product[]
  currentPage: number
  totalPages: number
  total: number
  currentSearch: string
}

const emptyForm: FormState = { name: '', price: '', cost: '', stock: '0', description: '', photoUrl: '' }

const PAGE_LIMIT = 50

export default function ProductsClient({
  initialProducts,
  currentPage,
  totalPages,
  total,
  currentSearch,
}: ProductsClientProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [sellProduct, setSellProduct] = useState<Product | null>(null)
  const [sellQty, setSellQty] = useState(1)
  const [selling, setSelling] = useState(false)
  const [sellError, setSellError] = useState<string | null>(null)
  const [sellSuccess, setSellSuccess] = useState<string | null>(null)

  // Pagination summary
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1
  const rangeEnd = Math.min(currentPage * PAGE_LIMIT, total)

  function buildHref(page: number) {
    return `/tovary?q=${encodeURIComponent(currentSearch)}&page=${page}`
  }

  function openSell(p: Product) {
    setSellProduct(p)
    setSellQty(1)
    setSellError(null)
    setSellSuccess(null)
  }

  async function completeSell() {
    if (!sellProduct) return
    setSelling(true)
    setSellError(null)
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: sellProduct.id, quantity: sellQty, price: sellProduct.price }] }),
    })
    setSelling(false)
    if (res.ok) {
      const sale = await res.json()
      setProducts((prev) =>
        prev.map((p) => p.id === sellProduct.id ? { ...p, stock: p.stock - sellQty } : p)
      )
      setSellProduct(null)
      setSellSuccess(`Продаж #${sale.id} завершено!`)
      setTimeout(() => setSellSuccess(null), 3000)
    } else {
      const data = await res.json()
      setSellError(data?.message ?? 'Помилка продажу')
    }
  }

  function openAdd() {
    setEditId(null)
    setForm(emptyForm)
    setError(null)
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name: p.name,
      price: String(p.price),
      cost: String(p.cost),
      stock: String(p.stock),
      description: p.description ?? '',
      photoUrl: p.photoUrl ?? '',
    })
    setError(null)
    setShowModal(true)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const data = await res.json()
      setForm((f) => ({ ...f, photoUrl: data.url }))
    } else {
      setError('Не вдалося завантажити фото')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const body = {
      name: form.name,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stock: parseInt(form.stock),
      description: form.description || undefined,
      photoUrl: form.photoUrl || undefined,
    }
    const res = await fetch(editId ? `/api/products/${editId}` : '/api/products', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        setError(JSON.stringify(data.error ?? data))
      } catch {
        setError(text || `Помилка ${res.status}`)
      }
      return
    }
    const saved: Product & { price: string | number; cost: string | number } = await res.json()
    const normalized: Product = {
      ...saved,
      price: parseFloat(String(saved.price)),
      cost: parseFloat(String(saved.cost)),
    }
    if (editId) {
      // Optimistic local update for edit — no count change, no pagination reset
      setProducts((prev) => prev.map((p) => (p.id === editId ? normalized : p)))
    } else {
      // New product: refresh server data and go to page 1
      router.refresh()
      router.push(`/tovary?q=${encodeURIComponent(currentSearch)}&page=1`)
    }
    setShowModal(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Видалити товар?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    setProducts((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <nav className="flex items-center gap-2">
          <NavLink href="/tovary">Товари</NavLink>
          <NavLink href="/prodazhi">Продажі</NavLink>
        </nav>
        <div className="flex flex-1 justify-center">
          <SearchInput defaultValue={currentSearch} placeholder="Пошук товарів..." />
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 rounded-lg bg-orange-400 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-orange-500"
        >
          + Додати товар
        </button>
      </header>

      <div className="p-4 md:p-6">

      {/* Mobile card grid */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
        {products.length === 0 && (
          <p className="text-gray-400 sm:col-span-2">Немає товарів</p>
        )}
        {products.map((p) => (
          <div key={p.id} className={`overflow-hidden rounded-xl border shadow-sm ${p.stock === 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
            {p.photoUrl ? (
              <img src={p.photoUrl} alt={p.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 w-full bg-gray-100" />
            )}
            <div className="p-3">
              <p className="font-medium text-gray-900">{p.name}</p>
              {p.description && (
                <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{p.description}</p>
              )}
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">{p.price.toFixed(2)} ₴</span>
                <span className="text-xs text-gray-500">Залишок: {p.stock}</span>
              </div>
              <div className="mt-2 flex w-full justify-end gap-2">
                <button
                  onClick={() => openSell(p)}
                  disabled={p.stock === 0}
                  className="flex items-center justify-center rounded-lg border border-green-300 px-2.5 py-1.5 text-green-700 hover:bg-green-50 disabled:opacity-40"
                  aria-label="Продати"
                >
                  <span className="material-icons" style={{ fontSize: 16 }}>sell</span>
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="flex items-center justify-center rounded-lg border border-orange-300 px-2.5 py-1.5 text-orange-600 hover:bg-orange-50"
                  aria-label="Редагувати"
                >
                  <span className="material-icons" style={{ fontSize: 16 }}>edit</span>
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center justify-center rounded-lg border border-red-300 px-2.5 py-1.5 text-red-600 hover:bg-red-50"
                  aria-label="Видалити"
                >
                  <span className="material-icons" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-orange-400">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">Фото</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">Назва</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">Опис</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-800">Ціна</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-800">Закупівельна</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-800">Залишок</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Немає товарів
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className={`border-b border-gray-100 ${p.stock === 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-orange-50'}`}>
                <td className="px-4 py-3">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-gray-100" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="max-w-xs px-4 py-3">
                  <p className="line-clamp-2 text-sm text-gray-500">{p.description}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{p.price.toFixed(2)} ₴</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{p.cost.toFixed(2)} ₴</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openSell(p)}
                      disabled={p.stock === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-40"
                      aria-label="Продати"
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>sell</span>
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-300 text-orange-600 hover:bg-orange-50"
                      aria-label="Редагувати"
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50"
                      aria-label="Видалити"
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="mt-4 flex flex-col items-center gap-3">
        {total > 0 && (
          <p className="text-sm text-gray-500">
            Показано {rangeStart}–{rangeEnd} з {total} товарів
          </p>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildHref}
        />
      </div>

      </div>{/* end padding div */}

      {sellSuccess && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-green-600 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {sellSuccess}
        </div>
      )}

      {sellProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Header: photo + name + stock badge */}
            <div className="flex items-center gap-4 p-6 pb-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {sellProduct.photoUrl ? (
                  <img src={sellProduct.photoUrl} alt={sellProduct.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-gray-900">{sellProduct.name}</h2>
                <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sellProduct.stock > 5 ? 'bg-green-100 text-green-700' : sellProduct.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {sellProduct.stock > 0 ? `${sellProduct.stock} шт. в наявності` : 'Немає в наявності'}
                </span>
              </div>
            </div>

            <hr className="mx-6 border-gray-100" />

            {/* Quantity stepper */}
            <div className="px-6 py-5">
              <p className="mb-3 text-center text-sm font-medium text-gray-500">Кількість</p>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => setSellQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-xl"
                >−</button>
                <span className="w-12 text-center text-2xl font-bold text-gray-900">{sellQty}</span>
                <button
                  onClick={() => setSellQty((q) => Math.min(sellProduct.stock, q + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-xl"
                >+</button>
              </div>
            </div>

            <hr className="mx-6 border-gray-100" />

            {/* Price summary */}
            <div className="px-6 py-4 text-center">
              <p className="text-sm text-gray-400">{sellProduct.price.toFixed(2)} ₴ × {sellQty}</p>
              <p className="mt-0.5 text-3xl font-bold text-gray-900">{(sellProduct.price * sellQty).toFixed(2)} ₴</p>
            </div>

            {sellError && <p className="px-6 pb-2 text-center text-sm text-red-600">{sellError}</p>}

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-2">
              <button
                onClick={completeSell}
                disabled={selling}
                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {selling ? 'Обробка...' : 'Продати'}
              </button>
              <button
                onClick={() => setSellProduct(null)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {editId ? 'Редагувати товар' : 'Новий товар'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="field-name">Назва</label>
                <input
                  id="field-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="field-price">Ціна (₴)</label>
                  <input
                    id="field-price"
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="field-cost">Закупівельна (₴)</label>
                  <input
                    id="field-cost"
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.cost}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="field-stock">Залишок</label>
                <input
                  id="field-stock"
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="field-description">Опис</label>
                <textarea
                  id="field-description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Фото</label>
                {form.photoUrl && (
                  <img src={form.photoUrl} alt="preview" className="mb-2 h-20 w-20 rounded object-cover" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-black hover:bg-orange-50"
                  >
                    Обрати фото
                  </button>
                  <span className="text-sm text-gray-500">{fileName || 'Файл не вибрано'}</span>
                </div>
                {uploading && <p className="mt-1 text-xs text-gray-400">Завантаження...</p>}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 rounded-lg bg-orange-400 py-2 text-sm font-medium text-gray-800 hover:bg-orange-500 disabled:opacity-50"
                >
                  {saving ? 'Збереження...' : 'Зберегти'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
