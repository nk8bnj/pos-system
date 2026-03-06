'use client'

import React, { useState } from 'react'
import type { DayStat } from './page'

export default function SaleDetail({ days }: { days: DayStat[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (days.length === 0) {
    return <p className="text-gray-500">Ще немає продажів.</p>
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const totalQty = day.items.reduce((s, i) => s + i.quantity, 0)
        const isOpen = expanded === day.date

        return (
          <div key={day.date} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <button
              onClick={() => setExpanded(isOpen ? null : day.date)}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-orange-50 transition-colors rounded-xl"
            >
              <span className="text-base font-semibold text-gray-800">
                {new Date(day.date).toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                  {totalQty} товарів
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                  {day.totalRevenue.toFixed(2)} ₴
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-gray-100 px-6 py-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      <th className="pb-3">Товар</th>
                      <th className="pb-3 text-right">Кількість</th>
                      <th className="pb-3 text-right">Ціна за од.</th>
                      <th className="pb-3 text-right">Сума</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {day.items.map((item) => (
                      <tr key={item.productName}>
                        <td className="py-2 text-gray-700">{item.productName}</td>
                        <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                        <td className="py-2 text-right text-gray-600">{item.unitPrice.toFixed(2)} ₴</td>
                        <td className="py-2 text-right text-gray-800">{item.subtotal.toFixed(2)} ₴</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-gray-700">
                        Разом:
                      </td>
                      <td className="pt-3 text-right text-sm font-bold text-gray-900">
                        {day.totalRevenue.toFixed(2)} ₴
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
