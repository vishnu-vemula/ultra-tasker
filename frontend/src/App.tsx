import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './features/auth/use-auth'
import { LoginPage } from './features/auth/components/login-page'
import { SignupPage } from './features/auth/components/signup-page'
import { AppShell } from './shared/components/app-shell'
import { DashboardPage } from './features/dashboard/components/dashboard-page'
import { ContactsPage } from './features/contacts/components/contacts-page'
import { ContactDetailPage } from './features/contacts/components/contact-detail-page'
import { CompaniesPage } from './features/companies/components/companies-page'
import { CompanyDetailPage } from './features/companies/components/company-detail-page'
import { DealsPage } from './features/deals/components/deals-page'
import { DealDetailPage } from './features/deals/components/deal-detail-page'
import { TasksPage } from './features/tasks/components/tasks-page'
import { UsersPage } from './features/users/components/users-page'
import { NotificationsPage } from './features/notifications/components/notifications-page'
import { TagsPage } from './features/tags/components/tags-page'
import { ProductsPage } from './features/products/components/products-page'

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
    </div>
  )
}

function RequireAuth() {
  const { firebaseUser, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!firebaseUser) return <Navigate to="/login" replace />
  return <AppShell />
}

function RequireAdmin() {
  const { role, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:contactId" element={<ContactDetailPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:companyId" element={<CompanyDetailPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/deals/:dealId" element={<DealDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings/tags" element={<TagsPage />} />
        <Route path="/settings/products" element={<ProductsPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/settings/users" element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
