import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Search } from 'lucide-react'
import { useCompanies } from '../hooks/use-companies'
import { useDeleteCompany } from '../hooks/use-company-mutations'
import { CompanyDialog } from './company-dialog'
import { PageHeader } from '../../../shared/components/page-header'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { useDebouncedValue } from '../../../shared/hooks/use-debounced-value'
import { formatDate } from '../../../shared/lib/format'

export function CompaniesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search)
  const deleteMutation = useDeleteCompany()

  const params = useMemo(
    () => ({ search: debouncedSearch, page, pageSize: 25 }),
    [debouncedSearch, page],
  )
  const { data, isLoading } = useCompanies(params)

  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 25
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  const openCreate = () => setDialogOpen(true)

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Organizations your contacts belong to"
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New company
          </button>
        }
      />
      <div className="mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search companies…"
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
        <SkeletonList count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add your first company to get started."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New company
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Domain</th>
                <th className="th">Industry</th>
                <th className="th">Created</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((company) => (
                <tr
                  key={company.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => router.push(`/companies/${company.id}`)}
                >
                  <td className="td font-medium text-slate-900">{company.name}</td>
                  <td className="td">{company.domain ?? '—'}</td>
                  <td className="td">{company.industry ?? '—'}</td>
                  <td className="td">{formatDate(company.createdAt)}</td>
                  <td className="td text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(company.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              {total} compan{total === 1 ? 'y' : 'ies'}
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
      {dialogOpen ? <CompanyDialog company={null} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
