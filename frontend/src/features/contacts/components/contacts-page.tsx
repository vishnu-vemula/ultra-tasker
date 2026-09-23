import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Plus, Search, UserPlus } from 'lucide-react'
import { toast } from 'react-toastify'
import { useContacts } from '../hooks/use-contacts'
import { useDeleteContact } from '../hooks/use-contact-mutations'
import { ContactDialog } from './contact-dialog'
import { PageHeader } from '../../../shared/components/page-header'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { StatusBadge } from '../../../shared/components/status-badge'
import { useDebouncedValue } from '../../../shared/hooks/use-debounced-value'
import { apiDownload } from '../../../shared/lib/api-client'
import { formatDate } from '../../../shared/lib/format'
import { CONTACT_STATUSES, type ContactStatus } from '../../../shared/types'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function ContactsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ContactStatus | ''>('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search)
  const deleteMutation = useDeleteContact()

  const params = useMemo(
    () => ({ search: debouncedSearch, status, page, pageSize: 25 }),
    [debouncedSearch, status, page],
  )
  const { data, isLoading } = useContacts(params)

  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 25
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  const openCreate = () => setDialogOpen(true)

  const exportCsv = async () => {
    try {
      await apiDownload('/contacts/export', 'contacts.csv')
      toast.success('Contacts exported')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Manage the people in your pipeline"
        action={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => void exportCsv()}>
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New contact
            </button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search contacts…"
            className="input pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          className="select w-44"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ContactStatus | '')
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          {CONTACT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No contacts yet"
          description="Add your first contact to get started."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New contact
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Company</th>
                <th className="th">Status</th>
                <th className="th">Created</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((contact) => (
                <tr
                  key={contact.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {initials(contact.name)}
                      </span>
                      <span className="font-medium text-slate-900">{contact.name}</span>
                    </div>
                  </td>
                  <td className="td">{contact.email ?? '—'}</td>
                  <td className="td">{contact.phone ?? '—'}</td>
                  <td className="td">{contact.company?.name ?? '—'}</td>
                  <td className="td">
                    <StatusBadge variant={contact.status} />
                  </td>
                  <td className="td">{formatDate(contact.createdAt)}</td>
                  <td className="td text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(contact.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              {total} contact{total === 1 ? '' : 's'}
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
      {dialogOpen ? <ContactDialog contact={null} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
