import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '../../../shared/components/dialog'
import { ACTIVITY_TYPES } from '../../../shared/types'
import { toDateTimeLocalValue } from '../../../shared/lib/format'
import { activityFormSchema, type ActivityFormValues } from '../model/schema'
import { useCreateActivity } from '../hooks/use-activity-mutations'
import { useContacts } from '../../contacts/hooks/use-contacts'
import { useDeals } from '../../deals/hooks/use-deals'

interface ActivityDialogProps {
  presetContactId?: string
  presetDealId?: string
  presetCompanyId?: string
  onClose: () => void
}

function toFormValues(): ActivityFormValues {
  return {
    type: 'NOTE',
    title: '',
    occurredAt: toDateTimeLocalValue(new Date()),
    durationMin: '',
    body: '',
    contactId: '',
    dealId: '',
  }
}

export function ActivityDialog({ presetContactId, presetDealId, presetCompanyId, onClose }: ActivityDialogProps) {
  const createMutation = useCreateActivity()
  const { data: contactPage } = useContacts({ page: 1, pageSize: 100 })
  const { data: dealPage } = useDeals({ page: 1, pageSize: 100 })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    values: toFormValues(),
  })

  const onSubmit = handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      type: values.type,
      title: values.title,
      body: values.body || undefined,
      occurredAt: new Date(values.occurredAt).toISOString(),
      durationMin: values.durationMin ? Number(values.durationMin) : null,
      contactId: presetContactId ?? (values.contactId || null),
      dealId: presetDealId ?? (values.dealId || null),
      companyId: presetCompanyId ?? null,
    })
    onClose()
  })

  const submitting = createMutation.isPending

  return (
    <Dialog title="Log activity" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="activity-type" className="label">
              Type
            </label>
            <select id="activity-type" className="select" {...register('type')}>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="activity-occurred-at" className="label">
              Occurred at
            </label>
            <input id="activity-occurred-at" type="datetime-local" className="input" {...register('occurredAt')} />
            {errors.occurredAt ? <p className="mt-1 text-sm text-red-600">{errors.occurredAt.message}</p> : null}
          </div>
        </div>
        <div>
          <label htmlFor="activity-title" className="label">
            Title
          </label>
          <input id="activity-title" type="text" className="input" {...register('title')} />
          {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
        </div>
        <div>
          <label htmlFor="activity-duration" className="label">
            Duration (minutes)
          </label>
          <input id="activity-duration" type="number" min="0" step="1" className="input" {...register('durationMin')} />
          {errors.durationMin ? <p className="mt-1 text-sm text-red-600">{errors.durationMin.message}</p> : null}
        </div>
        {presetContactId === undefined ? (
          <div>
            <label htmlFor="activity-contact" className="label">
              Contact
            </label>
            <select id="activity-contact" className="select" {...register('contactId')}>
              <option value="">No contact</option>
              {(contactPage?.items ?? []).map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {presetDealId === undefined ? (
          <div>
            <label htmlFor="activity-deal" className="label">
              Deal
            </label>
            <select id="activity-deal" className="select" {...register('dealId')}>
              <option value="">No deal</option>
              {(dealPage?.items ?? []).map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label htmlFor="activity-body" className="label">
            Notes
          </label>
          <textarea id="activity-body" rows={3} className="input" {...register('body')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Log activity'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
