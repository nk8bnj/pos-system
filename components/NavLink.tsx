'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-orange-400 text-gray-800 font-semibold shadow-sm'
          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
      }`}
    >
      {children}
    </Link>
  )
}
