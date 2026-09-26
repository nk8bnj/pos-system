'use client'

import React, { useMemo, useState } from 'react'
import type { DayStat } from './page'

interface PeriodSummary {
  totalQuantity: number
  totalRevenue: number
}

interface MonthGroup extends PeriodSummary {
  key: string
  label: string
  days: DayStat[]
}

interface YearGroup extends PeriodSummary {
  key: string
  months: MonthGroup[]
}

function getDayQuantity(day: DayStat) {
  return day.items.reduce((sum, item) => sum + item.quantity, 0)
}

function formatCount(count: number, forms: [string, string, string]) {
  const category = new Intl.PluralRules('uk-UA').select(count)
  const form = category === 'one' ? forms[0] : category === 'few' ? forms[1] : forms[2]
  return `${count} ${form}`
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatMonth(monthKey: string) {
  const label = new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString('uk-UA', {
    month: 'long',
    timeZone: 'UTC',
  })

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function groupDaysByYearAndMonth(days: DayStat[]): YearGroup[] {
  const years = new Map<string, Map<string, DayStat[]>>()

  for (const day of days) {
    const yearKey = day.date.slice(0, 4)
    const monthKey = day.date.slice(0, 7)

    if (!years.has(yearKey)) years.set(yearKey, new Map())
    const months = years.get(yearKey)!
    if (!months.has(monthKey)) months.set(monthKey, [])
    months.get(monthKey)!.push(day)
  }

  return Array.from(years.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([yearKey, months]) => {
      const monthGroups = Array.from(months.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([monthKey, monthDays]) => ({
          key: monthKey,
          label: formatMonth(monthKey),
          days: [...monthDays].sort((a, b) => b.date.localeCompare(a.date)),
          totalQuantity: monthDays.reduce((sum, day) => sum + getDayQuantity(day), 0),
          totalRevenue: monthDays.reduce((sum, day) => sum + day.totalRevenue, 0),
        }))

      return {
        key: yearKey,
        months: monthGroups,
        totalQuantity: monthGroups.reduce((sum, month) => sum + month.totalQuantity, 0),
        totalRevenue: monthGroups.reduce((sum, month) => sum + month.totalRevenue, 0),
      }
    })
}

function SummaryBadges({ totalQuantity, totalRevenue }: PeriodSummary) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
        {formatCount(totalQuantity, ['товар', 'товари', 'товарів'])}
      </span>
      <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
        {totalRevenue.toFixed(2)} ₴
      </span>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function SaleDetail({ days }: { days: DayStat[] }) {
  const years = useMemo(() => groupDaysByYearAndMonth(days), [days])
  const [expandedYears, setExpandedYears] = useState<Set<string>>(
    () => new Set(years[0] ? [years[0].key] : [])
  )
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set(years[0]?.months[0] ? [years[0].months[0].key] : [])
  )
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  function togglePeriod(key: string, setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (days.length === 0) {
    return <p className="text-gray-500">Ще немає продажів.</p>
  }

  return (
    <div className="space-y-5">
      {years.map((year) => {
        const isYearOpen = expandedYears.has(year.key)

        return (
          <section key={year.key} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <button
              type="button"
              aria-expanded={isYearOpen}
              onClick={() => togglePeriod(year.key, setExpandedYears)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-orange-50 md:px-6"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900">{year.key}</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {formatCount(year.months.length, ['місяць', 'місяці', 'місяців'])}
                </p>
                <div className="mt-2 sm:hidden">
                  <SummaryBadges totalQuantity={year.totalQuantity} totalRevenue={year.totalRevenue} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <SummaryBadges totalQuantity={year.totalQuantity} totalRevenue={year.totalRevenue} />
                </div>
                <Chevron open={isYearOpen} />
              </div>
            </button>

            {isYearOpen && (
              <div className="space-y-3 border-t border-gray-200 bg-gray-50 p-3 md:p-4">
                {year.months.map((month) => {
                  const isMonthOpen = expandedMonths.has(month.key)

                  return (
                    <div key={month.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <button
                        type="button"
                        aria-expanded={isMonthOpen}
                        onClick={() => togglePeriod(month.key, setExpandedMonths)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-orange-50 md:px-5"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-800">{month.label}</h3>
                          <p className="text-xs text-gray-500">
                            {formatCount(month.days.length, ['день', 'дні', 'днів'])} із продажами
                          </p>
                          <div className="mt-2 sm:hidden">
                            <SummaryBadges totalQuantity={month.totalQuantity} totalRevenue={month.totalRevenue} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block">
                            <SummaryBadges totalQuantity={month.totalQuantity} totalRevenue={month.totalRevenue} />
                          </div>
                          <Chevron open={isMonthOpen} />
                        </div>
                      </button>

                      {isMonthOpen && (
                        <div className="space-y-2 border-t border-gray-100 bg-gray-50/60 p-2 md:p-3">
                          {month.days.map((day) => {
                            const totalQuantity = getDayQuantity(day)
                            const isDayOpen = expandedDay === day.date

                            return (
                              <div key={day.date} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                <button
                                  type="button"
                                  aria-expanded={isDayOpen}
                                  onClick={() => setExpandedDay(isDayOpen ? null : day.date)}
                                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-orange-50"
                                >
                                  <div>
                                    <span className="font-medium text-gray-800">{formatDay(day.date)}</span>
                                    <div className="mt-2 sm:hidden">
                                      <SummaryBadges totalQuantity={totalQuantity} totalRevenue={day.totalRevenue} />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="hidden sm:block">
                                      <SummaryBadges totalQuantity={totalQuantity} totalRevenue={day.totalRevenue} />
                                    </div>
                                    <Chevron open={isDayOpen} />
                                  </div>
                                </button>

                                {isDayOpen && (
                                  <div className="overflow-x-auto border-t border-gray-100 px-4 py-4">
                                    <table className="w-full min-w-[36rem] text-sm">
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
                                          <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700">Разом:</td>
                                          <td className="pt-3 text-right font-bold text-gray-900">{day.totalRevenue.toFixed(2)} ₴</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
