import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { useContactDetail } from '../hooks/use-contacts'
import { useSetContactTags } from '../hooks/use-contact-mutations'
import { ContactDialog } from './contact-dialog'
import { DetailHeader } from '../../../shared/components/detail-header'
import { DescriptionList } from '../../../shared/components/description-list'
import { SkeletonList } from '../../../shared/components/skeleton'
import { StatusBadge } from '../../../shared/components/status-badge'
import { AuditSection } from '../../../shared/components/audit-section'
import { formatDate, formatCurrency, titleCase } from '../../../shared/lib/format'
import { ActivityTimeline } from '../../activities/components/activity-timeline'
import { ActivityDialog } from '../../activities/components/activity-dialog'
import { TagSelect } from '../../tags/components/tag-select'

export function ContactDetailPage() {
  const { contactId } = useParams<{ contactId: string }>()
  const router = useRouter()
  const { data: contact, isLoading } = useContactDetail(contactId ?? '')
  const setTagsMutation = useSetContactTags()
  const [editOpen, setEditOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [draftTagIds, setDraftTagIds] = useState<string[]>([])

  if (isLoading || !contact) {
    return (
      <div>
        <DetailHeader backTo="/contacts" backLabel="Contacts" title="Contact" />
        <SkeletonList count={5} />
      </div>
    )
  }

  const startEditTags = () => {
    setDraftTagIds(contact.tags.map((tag) => tag.id))
    setEditingTags(true)
  }

  const saveTags = async () => {
    await setTagsMutation.mutateAsync({ id: contact.id, tagIds: draftTagIds })
    setEditingTags(false)
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/contacts"
        backLabel="Contacts"
        title={contact.name}
        subtitle={contact.position ? `${contact.position}${contact.company ? ` at ${contact.company.name}` : ''}` : contact.company?.name ?? undefined}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setActivityOpen(true)}>
              <Plus className="h-4 w-4" />
              Log activity
            </button>
            <button type="button" className="btn-primary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit contact
            </button>
          </>
        }
      />

      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Profile</h2>
        <DescriptionList
          items={[
            { label: 'Email', value: contact.email ?? '—' },
            { label: 'Phone', value: contact.phone ?? '—' },
            { label: 'Status', value: <StatusBadge variant={contact.status} /> },
            {
              label: 'Company',
              value:
                contact.company && contact.companyId ? (
                  <Link className="text-indigo-600 hover:text-indigo-700" href={`/companies/${contact.companyId}`}>
                    {contact.company.name}
                  </Link>
                ) : (
                  '—'
                ),
            },
            {
              label: 'Website',
              value: contact.website ? (
                <a className="text-indigo-600 hover:text-indigo-700" href={contact.website} target="_blank" rel="noreferrer">
                  {contact.website}
                </a>
              ) : (
                '—'
              ),
            },
            { label: 'Source', value: contact.source ? titleCase(contact.source) : '—' },
            { label: 'City', value: contact.city ?? '—' },
            { label: 'Country', value: contact.country ?? '—' },
            { label: 'Last activity', value: formatDate(contact.lastActivityAt) },
            { label: 'Created', value: formatDate(contact.createdAt) },
            { label: 'Notes', value: contact.notes ?? '—' },
          ]}
        />
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</span>
            {editingTags ? (
              <div className="flex gap-2">
                <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => setEditingTags(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary px-2.5 py-1 text-xs"
                  disabled={setTagsMutation.isPending}
                  onClick={() => void saveTags()}
                >
                  Save tags
                </button>
              </div>
            ) : (
              <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-700" onClick={startEditTags}>
                Edit tags
              </button>
            )}
          </div>
          {editingTags ? (
            <TagSelect value={draftTagIds} onChange={setDraftTagIds} />
          ) : contact.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <span key={tag.id} className="badge items-center gap-1.5 bg-slate-100 text-slate-700">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No tags.</p>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Deals</h2>
        {contact.deals.length === 0 ? (
          <p className="text-sm text-slate-500">No deals for this contact yet.</p>
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
              {contact.deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => router.push(`/deals/${deal.id}`)}
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
        <h2 className="mb-4 text-base font-semibold text-slate-900">Tasks</h2>
        {contact.tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks for this contact yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contact.tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">Due {formatDate(task.dueDate)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {task.priority ? <StatusBadge variant={task.priority} /> : null}
                  <StatusBadge variant={task.status} />
                </div>
              </li>
            ))}
          </ul>
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
        <ActivityTimeline activities={contact.activities} />
      </section>

      <AuditSection entityType="CONTACT" entityId={contact.id} />

      {editOpen ? <ContactDialog contact={contact} onClose={() => setEditOpen(false)} /> : null}
      {activityOpen ? (
        <ActivityDialog presetContactId={contact.id} onClose={() => setActivityOpen(false)} />
      ) : null}
    </div>
  )
}
