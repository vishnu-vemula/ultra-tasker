import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Building2, KanbanSquare, LayoutDashboard, LogOut, Package, Tags, Users, UsersRound, Zap } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../features/auth/use-auth'
import { GlobalSearch } from '../../features/search/components/global-search'
import { NotificationsBell } from '../../features/notifications/components/notifications-bell'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
  section?: 'main' | 'settings'
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { to: '/contacts', label: 'Contacts', icon: UsersRound, section: 'main' },
  { to: '/companies', label: 'Companies', icon: Building2, section: 'main' },
  { to: '/deals', label: 'Deals', icon: KanbanSquare, section: 'main' },
  { to: '/tasks', label: 'Tasks', icon: Zap, section: 'main' },
  { to: '/settings/users', label: 'Users', icon: Users, adminOnly: true, section: 'settings' },
  { to: '/settings/tags', label: 'Tags', icon: Tags, section: 'settings' },
  { to: '/settings/products', label: 'Products', icon: Package, section: 'settings' },
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
  const mainItems = visibleItems.filter((item) => item.section !== 'settings')
  const settingItems = visibleItems.filter((item) => item.section === 'settings')

  const renderLink = ({ to, label, icon: Icon }: NavItem) => (
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
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Zap className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold text-slate-900">Ultra Tasker</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {mainItems.map(renderLink)}
          {settingItems.length > 0 ? (
            <div className="pt-4">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Settings</p>
              <div className="space-y-1">{settingItems.map(renderLink)}</div>
            </div>
          ) : null}
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
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-8 py-3">
          <GlobalSearch />
          <div className="ml-auto">
            <NotificationsBell />
          </div>
        </header>
        <div className="flex-1 overflow-x-auto">
          <div className="mx-auto max-w-7xl p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
