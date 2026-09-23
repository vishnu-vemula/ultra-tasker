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
import { Badge } from '../../../shared/components/ui/badge'
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
            <Button type="button" variant="outline" onClick={() => setActivityOpen(true)}>
              <Plus className="h-4 w-4" />
              Log activity
            </Button>
            <Button type="button" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit contact
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
              { label: 'Email', value: contact.email ?? '—' },
              { label: 'Phone', value: contact.phone ?? '—' },
              { label: 'Status', value: <StatusBadge variant={contact.status} /> },
              {
                label: 'Company',
                value:
                  contact.company && contact.companyId ? (
                    <Link className="text-primary hover:text-primary/80" href={`/companies/${contact.companyId}`}>
                      {contact.company.name}
                    </Link>
                  ) : (
                    '—'
                  ),
              },
              {
                label: 'Website',
                value: contact.website ? (
                  <a className="text-primary hover:text-primary/80" href={contact.website} target="_blank" rel="noreferrer">
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
          <div className="mt-6 border-t pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Tags</span>
              {editingTags ? (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingTags(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={setTagsMutation.isPending}
                    onClick={() => void saveTags()}
                  >
                    Save tags
                  </Button>
                </div>
              ) : (
                <button type="button" className="text-xs font-medium text-primary hover:text-primary/80" onClick={startEditTags}>
                  Edit tags
                </button>
              )}
            </div>
            {editingTags ? (
              <TagSelect value={draftTagIds} onChange={setDraftTagIds} />
            ) : contact.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <Badge key={tag.id} variant="muted" className="gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {contact.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals for this contact yet.</p>
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
                {contact.deals.map((deal) => (
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
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {contact.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks for this contact yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {contact.tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {task.priority ? <StatusBadge variant={task.priority} /> : null}
                    <StatusBadge variant={task.status} />
                  </div>
                </li>
              ))}
            </ul>
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
          <ActivityTimeline activities={contact.activities} />
        </CardContent>
      </Card>

      <AuditSection entityType="CONTACT" entityId={contact.id} />

      {editOpen ? <ContactDialog contact={contact} onClose={() => setEditOpen(false)} /> : null}
      {activityOpen ? (
        <ActivityDialog presetContactId={contact.id} onClose={() => setActivityOpen(false)} />
      ) : null}
    </div>
  )
}
