import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Building2, KanbanSquare, LayoutDashboard, LogOut, Users, UsersRound, Zap } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../features/auth/use-auth'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contacts', label: 'Contacts', icon: UsersRound },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/deals', label: 'Deals', icon: KanbanSquare },
  { to: '/tasks', label: 'Tasks', icon: Zap },
  { to: '/settings/users', label: 'Users', icon: Users, adminOnly: true },
]

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function AppShell() {
  const { profile, firebaseUser, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const visibleItems = navItems.filter((item) => !item.adminOnly || profile?.role === 'ADMIN')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Zap className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold text-slate-900">Ultra Tasker</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            {firebaseUser?.photoURL ? (
              <img src={firebaseUser.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {initials(profile?.displayName ?? null, firebaseUser?.email ?? '')}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {profile?.displayName ?? firebaseUser?.displayName ?? 'Account'}
              </p>
              <p className="truncate text-xs text-slate-500">{firebaseUser?.email}</p>
            </div>
          </div>
          <button type="button" className="btn-secondary w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto max-w-7xl p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
