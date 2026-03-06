'use client'

import { useState } from 'react'
import NavLink from './NavLink'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          aria-label="Відкрити меню"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="2" y1="4.5" x2="16" y2="4.5" />
            <line x1="2" y1="9" x2="16" y2="9" />
            <line x1="2" y1="13.5" x2="16" y2="13.5" />
          </svg>
        </button>
        <span className="text-sm font-bold tracking-wide text-gray-900">POS Система</span>
        <div className="w-9" />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-orange-400 px-4 py-5">
              <p className="text-sm font-bold tracking-wide text-white">POS Система</p>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white"
                aria-label="Закрити меню"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="3" x2="15" y2="15" />
                  <line x1="15" y1="3" x2="3" y2="15" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-1 px-3 py-4" onClick={() => setOpen(false)}>
              <NavLink href="/kasa">Каса</NavLink>
              <NavLink href="/tovary">Товари</NavLink>
              <NavLink href="/sklad">Склад</NavLink>
              <NavLink href="/prodazhi">Продажі</NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
