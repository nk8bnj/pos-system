'use client'

import { useState } from 'react'

interface Product {
  id: number
  name: string
  stock: number
}

export default function SkladClient({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0)
  const [quantity, setQuantity] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: Number(productId), quantity: Number(quantity) }),
    })
    setLoading(false)
    if (res.ok) {
      setStatus('Склад оновлено успішно!')
      setQuantity('')
    } else {
      const data = await res.json()
      setStatus(`Помилка: ${JSON.stringify(data.error)}`)
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Оновлення складу</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Товар</label>
          <select
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (залишок: {p.stock})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Кількість</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !quantity}
          className="w-full rounded-lg bg-orange-400 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-orange-500 disabled:opacity-50"
        >
          {loading ? 'Оновлення...' : 'Додати на склад'}
        </button>
        {status && (
          <p className={`text-sm ${status.startsWith('Помилка') ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
        )}
      </form>
    </div>
  )
}
