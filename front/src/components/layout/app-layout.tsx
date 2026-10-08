import { NavLink, Outlet } from 'react-router'
import { UsersIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/members', label: 'Membres' },
  { to: '/groups', label: 'Groupes' },
]

export function AppLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <div className="flex items-center gap-2 font-semibold">
            <UsersIcon className="size-5" />
            Team Generator
          </div>
          <nav className="flex gap-4 text-sm">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'text-foreground font-medium',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
