import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { useCompanyDetail } from '../hooks/use-companies'
import { CompanyDialog } from './company-dialog'
import { DetailHeader } from '../../../shared/components/detail-header'
import { DescriptionList } from '../../../shared/components/description-list'
import { SkeletonList } from '../../../shared/components/skeleton'
import { StatusBadge } from '../../../shared/components/status-badge'
import { AuditSection } from '../../../shared/components/audit-section'
import { Button } from '../../../shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table'
import { formatCurrency, formatDate } from '../../../shared/lib/format'
import { useActivities } from '../../activities/hooks/use-activities'
import { ActivityTimeline } from '../../activities/components/activity-timeline'
import { ActivityDialog } from '../../activities/components/activity-dialog'

export function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const router = useRouter()
  const { data: company, isLoading } = useCompanyDetail(companyId ?? '')
  const { data: activityPage } = useActivities({ companyId: companyId ?? '', pageSize: 10 })
  const [editOpen, setEditOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  if (isLoading || !company) {
    return (
      <div>
        <DetailHeader backTo="/companies" backLabel="Companies" title="Company" />
        <SkeletonList count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/companies"
        backLabel="Companies"
        title={company.name}
        subtitle={company.industry ?? undefined}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setActivityOpen(true)}>
              <Plus className="h-4 w-4" />
              Log activity
            </Button>
            <Button type="button" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit company
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <DescriptionList
            items={[
              { label: 'Domain', value: company.domain ?? '—' },
              { label: 'Industry', value: company.industry ?? '—' },
              { label: 'Phone', value: company.phone ?? '—' },
              { label: 'City', value: company.city ?? '—' },
              { label: 'Country', value: company.country ?? '—' },
              { label: 'Employees', value: company.employeeCount !== null ? String(company.employeeCount) : '—' },
              {
                label: 'Annual revenue',
                value: company.annualRevenue !== null ? formatCurrency(company.annualRevenue, 'USD') : '—',
              },
              { label: 'Created', value: formatDate(company.createdAt) },
              { label: 'Notes', value: company.notes ?? '—' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {company.contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts at this company yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <TableCell>
                      <span className="font-medium text-foreground">{contact.name}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{contact.email ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.position ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={contact.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {company.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals for this company yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Expected close</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.deals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <TableCell>
                      <span className="font-medium text-foreground">{deal.title}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={deal.stage} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(deal.value, deal.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(deal.expectedCloseDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity</CardTitle>
            <Button type="button" variant="outline" onClick={() => setActivityOpen(true)}>
              <Plus className="h-4 w-4" />
              Log activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={activityPage?.items ?? []} />
        </CardContent>
      </Card>

      <AuditSection entityType="COMPANY" entityId={company.id} />

      {editOpen ? <CompanyDialog company={company} onClose={() => setEditOpen(false)} /> : null}
      {activityOpen ? (
        <ActivityDialog presetCompanyId={company.id} onClose={() => setActivityOpen(false)} />
      ) : null}
    </div>
  )
}
