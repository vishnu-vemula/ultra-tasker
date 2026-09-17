import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { useCompanyDetail } from '../hooks/use-companies'
import { CompanyDialog } from './company-dialog'
import { DetailHeader } from '../../../shared/components/detail-header'
import { DescriptionList } from '../../../shared/components/description-list'
import { SkeletonList } from '../../../shared/components/skeleton'
import { StatusBadge } from '../../../shared/components/status-badge'
import { AuditSection } from '../../../shared/components/audit-section'
import { formatCurrency, formatDate } from '../../../shared/lib/format'
import { useActivities } from '../../activities/hooks/use-activities'
import { ActivityTimeline } from '../../activities/components/activity-timeline'
import { ActivityDialog } from '../../activities/components/activity-dialog'

export function CompanyDetailPage() {
  const { companyId } = useParams()
  const navigate = useNavigate()
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
            <button type="button" className="btn-secondary" onClick={() => setActivityOpen(true)}>
              <Plus className="h-4 w-4" />
              Log activity
            </button>
            <button type="button" className="btn-primary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit company
            </button>
          </>
        }
      />

      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Profile</h2>
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
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Contacts</h2>
        {company.contacts.length === 0 ? (
          <p className="text-sm text-slate-500">No contacts at this company yet.</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Position</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {company.contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                >
                  <td className="td font-medium text-slate-900">{contact.name}</td>
                  <td className="td">{contact.email ?? '—'}</td>
                  <td className="td">{contact.position ?? '—'}</td>
                  <td className="td">
                    <StatusBadge variant={contact.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Deals</h2>
        {company.deals.length === 0 ? (
          <p className="text-sm text-slate-500">No deals for this company yet.</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="th">Title</th>
                <th className="th">Stage</th>
                <th className="th">Value</th>
                <th className="th">Expected close</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {company.deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => navigate(`/deals/${deal.id}`)}
                >
                  <td className="td font-medium text-slate-900">{deal.title}</td>
                  <td className="td">
                    <StatusBadge variant={deal.stage} />
                  </td>
                  <td className="td">{formatCurrency(deal.value, deal.currency)}</td>
                  <td className="td">{formatDate(deal.expectedCloseDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Activity</h2>
          <button type="button" className="btn-secondary" onClick={() => setActivityOpen(true)}>
            <Plus className="h-4 w-4" />
            Log activity
          </button>
        </div>
        <ActivityTimeline activities={activityPage?.items ?? []} />
      </section>

      <AuditSection entityType="COMPANY" entityId={company.id} />

      {editOpen ? <CompanyDialog company={company} onClose={() => setEditOpen(false)} /> : null}
      {activityOpen ? (
        <ActivityDialog presetCompanyId={company.id} onClose={() => setActivityOpen(false)} />
      ) : null}
    </div>
  )
}
