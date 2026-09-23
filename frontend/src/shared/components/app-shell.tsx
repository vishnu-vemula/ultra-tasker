import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  Building2,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Package,
  Tags,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../features/auth/use-auth'
import { GlobalSearch } from '../../features/search/components/global-search'
import { NotificationsBell } from '../../features/notifications/components/notifications-bell'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Separator } from './ui/separator'

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

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, firebaseUser, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const visibleItems = navItems.filter((item) => !item.adminOnly || profile?.role === 'ADMIN')
  const mainItems = visibleItems.filter((item) => item.section !== 'settings')
  const settingItems = visibleItems.filter((item) => item.section === 'settings')

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  const renderLink = ({ to, label, icon: Icon }: NavItem) => (
    <Link
      key={to}
      href={to}
      className={clsx(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive(to)
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      <Icon
        className={clsx(
          'h-4 w-4 transition-colors',
          isActive(to) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      {label}
    </Link>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
            <Zap className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">Ultra Tasker</span>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {mainItems.map(renderLink)}
          {settingItems.length > 0 ? (
            <div className="pt-5">
              <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Settings
              </p>
              <div className="space-y-1">{settingItems.map(renderLink)}</div>
            </div>
          ) : null}
        </nav>
        <Separator />
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-9 w-9">
                  {firebaseUser?.photoURL ? (
                    <AvatarImage src={firebaseUser.photoURL} alt="" />
                  ) : null}
                  <AvatarFallback>
                    {initials(profile?.displayName ?? null, firebaseUser?.email ?? '')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile?.displayName ?? firebaseUser?.displayName ?? 'Account'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{firebaseUser?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium text-foreground">
                  {profile?.displayName ?? 'Account'}
                </p>
                <p className="text-xs text-muted-foreground">{firebaseUser?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/80 px-8 py-3 backdrop-blur">
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link href="/tasks">Go to tasks</Link>
            </Button>
            <NotificationsBell />
          </div>
        </header>
        <div className="flex-1 overflow-x-auto">
          <div className="mx-auto max-w-7xl animate-fade-in p-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
