import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useUsers } from '../hooks/use-users'
import { useUpdateUserRole } from '../hooks/use-user-mutations'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonList } from '../../../shared/components/skeleton'
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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="search"
            placeholder="Search users…"
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
        <SkeletonList count={4} />
      ) : !data || data.items.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">No users found.</Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.displayName ?? '—'}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={user.id === profile?.id || roleMutation.isPending}
                      onValueChange={(value) =>
                        roleMutation.mutate({ id: user.id, role: value as Role })
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {total} user{total === 1 ? '' : 's'}
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
      <p className="mt-3 text-sm text-muted-foreground/70">Role changes apply after the user&apos;s next login.</p>
    </div>
  )
}
