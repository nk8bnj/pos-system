import NavLink from './NavLink'

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
      <nav className="flex items-center gap-2">
        <NavLink href="/tovary">Товари</NavLink>
        <NavLink href="/prodazhi">Продажі</NavLink>
      </nav>
    </header>
  )
}
