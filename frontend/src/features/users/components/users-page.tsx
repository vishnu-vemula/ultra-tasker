import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useUsers } from '../hooks/use-users'
import { useUpdateUserRole } from '../hooks/use-user-mutations'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonList } from '../../../shared/components/skeleton'
import { useDebouncedValue } from '../../../shared/hooks/use-debounced-value'
import { formatDate } from '../../../shared/lib/format'
import type { Role } from '../../../shared/types'
import { useAuth } from '../../auth/use-auth'

export function UsersPage() {
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)
  const roleMutation = useUpdateUserRole()

  const params = useMemo(
    () => ({ search: debouncedSearch, page, pageSize: 50 }),
    [debouncedSearch, page],
  )
  const { data, isLoading } = useUsers(params)

  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 50
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div>
      <PageHeader title="Users" description="Manage team members and their roles" />
      <div className="mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search users…"
            className="input pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : !data || data.items.length === 0 ? (
        <div className="card p-12 text-center text-sm text-slate-500">No users found.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Email</th>
                <th className="th">Name</th>
                <th className="th">Role</th>
                <th className="th">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50">
                  <td className="td font-medium text-slate-900">{user.email}</td>
                  <td className="td">{user.displayName ?? '—'}</td>
                  <td className="td">
                    <select
                      className="select w-36"
                      value={user.role}
                      disabled={user.id === profile?.id || roleMutation.isPending}
                      onChange={(event) =>
                        roleMutation.mutate({ id: user.id, role: event.target.value as Role })
                      }
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="td">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              {total} user{total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={!canPrev}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={!canNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      <p className="mt-3 text-sm text-slate-400">Role changes apply after the user&apos;s next login.</p>
    </div>
  )
}
