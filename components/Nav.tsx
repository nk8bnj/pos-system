import NavLink from './NavLink'

export default function Nav() {
  return (
    <nav className="flex flex-col">
      <div className="bg-orange-400 px-4 py-5">
        <p className="text-sm font-bold tracking-wide text-white">POS Система</p>
      </div>
      <div className="flex flex-col gap-1 px-3 py-4">
        <NavLink href="/tovary">Товари</NavLink>
        <NavLink href="/sklad">Склад</NavLink>
        <NavLink href="/prodazhi">Продажі</NavLink>
      </div>
    </nav>
  )
}
