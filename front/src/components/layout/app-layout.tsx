import { NavLink, Outlet } from 'react-router'
import { UsersIcon } from 'lucide-react'
import { apiMocked } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const links = [
  { to: '/members', label: 'Membres' },
  { to: '/groups', label: 'Groupes' },
]

export function AppLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:gap-6">
          <div className="flex items-center gap-2 font-semibold">
            <UsersIcon className="size-5" />
            <span className="hidden sm:inline">Team Generator</span>
          </div>
          <nav className="flex gap-1 text-sm">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'bg-muted font-medium text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          {apiMocked && (
            <Badge variant="outline" className="ml-auto" title="Données simulées (MSW)">
              API mockée
            </Badge>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
