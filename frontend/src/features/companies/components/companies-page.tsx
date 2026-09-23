import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { useCompanies } from '../hooks/use-companies'
import { useDeleteCompany } from '../hooks/use-company-mutations'
import { CompanyDialog } from './company-dialog'
import { PageHeader } from '../../../shared/components/page-header'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { Button } from '../../../shared/components/ui/button'
import { Card } from '../../../shared/components/ui/card'
import { Input } from '../../../shared/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table'
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
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New company
          </Button>
        }
      />
      <div className="mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies…"
            className="pl-9"
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
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New company
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/companies/${company.id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-foreground">{company.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{company.domain ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{company.industry ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(company.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(company.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {total} compan{total === 1 ? 'y' : 'ies'}
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
      {dialogOpen ? <CompanyDialog company={null} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
