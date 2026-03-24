'use client'

import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface SearchInputProps {
  defaultValue: string
  placeholder?: string
}

export default function SearchInput({
  defaultValue,
  placeholder = 'Пошук товарів...',
}: SearchInputProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(`/tovary?q=${encodeURIComponent(value)}&page=1`)
      })
    }, 300)
  }

  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={handleChange}
      className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  )
}
