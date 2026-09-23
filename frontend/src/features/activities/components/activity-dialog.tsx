import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog } from '../../../shared/components/dialog'
import { Button } from '../../../shared/components/ui/button'
import { Input } from '../../../shared/components/ui/input'
import { Label } from '../../../shared/components/ui/label'
import { Textarea } from '../../../shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select'
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
    control,
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
          <div className="space-y-2">
            <Label>Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-occurred-at">Occurred at</Label>
            <Input id="activity-occurred-at" type="datetime-local" {...register('occurredAt')} />
            {errors.occurredAt ? (
              <p className="text-sm text-destructive">{errors.occurredAt.message}</p>
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-title">Title</Label>
          <Input id="activity-title" type="text" {...register('title')} />
          {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-duration">Duration (minutes)</Label>
          <Input id="activity-duration" type="number" min="0" step="1" {...register('durationMin')} />
          {errors.durationMin ? (
            <p className="text-sm text-destructive">{errors.durationMin.message}</p>
          ) : null}
        </div>
        {presetContactId === undefined ? (
          <div className="space-y-2">
            <Label>Contact</Label>
            <Controller
              control={control}
              name="contactId"
              render={({ field }) => (
                <Select
                  value={field.value || 'NONE'}
                  onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No contact</SelectItem>
                    {(contactPage?.items ?? []).map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : null}
        {presetDealId === undefined ? (
          <div className="space-y-2">
            <Label>Deal</Label>
            <Controller
              control={control}
              name="dealId"
              render={({ field }) => (
                <Select
                  value={field.value || 'NONE'}
                  onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No deal</SelectItem>
                    {(dealPage?.items ?? []).map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="activity-body">Notes</Label>
          <Textarea id="activity-body" rows={3} {...register('body')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Saving…' : 'Log activity'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
