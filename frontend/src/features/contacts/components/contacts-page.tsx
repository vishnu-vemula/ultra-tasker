import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Download, Plus, Search, UserPlus } from 'lucide-react'
import { toast } from 'react-toastify'
import { useContacts } from '../hooks/use-contacts'
import { useDeleteContact } from '../hooks/use-contact-mutations'
import { ContactDialog } from './contact-dialog'
import { PageHeader } from '../../../shared/components/page-header'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { StatusBadge } from '../../../shared/components/status-badge'
import { Avatar, AvatarFallback } from '../../../shared/components/ui/avatar'
import { Button } from '../../../shared/components/ui/button'
import { Card } from '../../../shared/components/ui/card'
import { Input } from '../../../shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table'
import { useDebouncedValue } from '../../../shared/hooks/use-debounced-value'
import { apiDownload } from '../../../shared/lib/api-client'
import { formatDate, titleCase } from '../../../shared/lib/format'
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
            <Button type="button" variant="outline" onClick={() => void exportCsv()}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New contact
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts…"
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={status || 'ALL'}
          onValueChange={(value) => {
            setStatus(value === 'ALL' ? '' : (value as ContactStatus))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {CONTACT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {titleCase(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No contacts yet"
          description="Add your first contact to get started."
          action={
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New contact
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {initials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{contact.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.email ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.phone ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.company?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={contact.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contact.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(contact.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {total} contact{total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
      {dialogOpen ? <ContactDialog contact={null} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
