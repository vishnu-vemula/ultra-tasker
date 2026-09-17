import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '../../../shared/components/dialog'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { CURRENCIES, DEAL_SOURCES, DEAL_STAGES, type Deal, type DealStage } from '../../../shared/types'
import { dealFormSchema, type DealFormValues } from '../model/schema'
import {
  useCreateDeal,
  useDeleteDeal,
  useSetDealTags,
  useUpdateDeal,
} from '../hooks/use-deal-mutations'
import { useContacts } from '../../contacts/hooks/use-contacts'
import { useCompanies } from '../../companies/hooks/use-companies'
import { TagSelect } from '../../tags/components/tag-select'

interface DealDialogProps {
  deal: Deal | null
  defaultStage?: DealStage
  onClose: () => void
}

function toFormValues(deal: Deal | null): DealFormValues {
  if (!deal) {
    return {
      title: '',
      value: 0,
      stage: 'NEW',
      currency: 'USD',
      probability: 0,
      source: '',
      nextStep: '',
      lostReason: '',
      contactId: '',
      companyId: '',
      expectedCloseDate: '',
      notes: '',
    }
  }
  return {
    title: deal.title,
    value: deal.value,
    stage: deal.stage,
    currency: (CURRENCIES.includes(deal.currency) ? deal.currency : 'USD') as DealFormValues['currency'],
    probability: deal.probability,
    source: deal.source ?? '',
    nextStep: deal.nextStep ?? '',
    lostReason: deal.lostReason ?? '',
    contactId: deal.contactId ?? '',
    companyId: deal.companyId ?? '',
    expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : '',
    notes: deal.notes ?? '',
  }
}

function sameTagIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id))
}

export function DealDialog({ deal, defaultStage, onClose }: DealDialogProps) {
  const createMutation = useCreateDeal()
  const updateMutation = useUpdateDeal()
  const deleteMutation = useDeleteDeal()
  const setTagsMutation = useSetDealTags()
  const { data: contactPage } = useContacts({ page: 1, pageSize: 100 })
  const { data: companyPage } = useCompanies({ page: 1, pageSize: 100 })
  const [tagIds, setTagIds] = useState<string[]>(deal?.tags.map((tag) => tag.id) ?? [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    values: deal ? toFormValues(deal) : { ...toFormValues(null), stage: defaultStage ?? 'NEW' },
  })

  const stage = watch('stage')

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      title: values.title,
      value: values.value,
      stage: values.stage,
      currency: values.currency,
      probability: values.probability,
      source: values.source || null,
      nextStep: values.nextStep || undefined,
      lostReason: values.lostReason || undefined,
      contactId: values.contactId || null,
      companyId: values.companyId || null,
      expectedCloseDate: values.expectedCloseDate || null,
      notes: values.notes || undefined,
    }
    if (deal) {
      const updated = await updateMutation.mutateAsync({ id: deal.id, input })
      if (!sameTagIds(tagIds, updated.tags.map((tag) => tag.id))) {
        await setTagsMutation.mutateAsync({ id: deal.id, tagIds })
      }
    } else {
      const created = await createMutation.mutateAsync(input)
      if (tagIds.length > 0) {
        await setTagsMutation.mutateAsync({ id: created.id, tagIds })
      }
    }
    onClose()
  })

  const submitting =
    createMutation.isPending || updateMutation.isPending || setTagsMutation.isPending

  return (
    <Dialog title={deal ? 'Edit deal' : 'New deal'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="deal-title" className="label">
            Title
          </label>
          <input id="deal-title" type="text" className="input" {...register('title')} />
          {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="deal-value" className="label">
              Value
            </label>
            <input id="deal-value" type="number" min="0" step="any" className="input" {...register('value')} />
            {errors.value ? <p className="mt-1 text-sm text-red-600">{errors.value.message}</p> : null}
          </div>
          <div>
            <label htmlFor="deal-currency" className="label">
              Currency
            </label>
            <select id="deal-currency" className="select" {...register('currency')}>
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="deal-stage" className="label">
              Stage
            </label>
            <select id="deal-stage" className="select" {...register('stage')}>
              {DEAL_STAGES.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0) + value.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="deal-probability" className="label">
              Probability (%)
            </label>
            <input
              id="deal-probability"
              type="number"
              min="0"
              max="100"
              step="1"
              className="input"
              {...register('probability')}
            />
            {errors.probability ? <p className="mt-1 text-sm text-red-600">{errors.probability.message}</p> : null}
          </div>
        </div>
        {stage === 'LOST' ? (
          <div>
            <label htmlFor="deal-lost-reason" className="label">
              Lost reason
            </label>
            <textarea id="deal-lost-reason" rows={2} className="input" {...register('lostReason')} />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="deal-source" className="label">
              Source
            </label>
            <select id="deal-source" className="select" {...register('source')}>
              <option value="">No source</option>
              {DEAL_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source.charAt(0) + source.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="deal-next-step" className="label">
              Next step
            </label>
            <input id="deal-next-step" type="text" className="input" {...register('nextStep')} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="deal-contact" className="label">
              Contact
            </label>
            <select id="deal-contact" className="select" {...register('contactId')}>
              <option value="">No contact</option>
              {(contactPage?.items ?? []).map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="deal-company" className="label">
              Company
            </label>
            <select id="deal-company" className="select" {...register('companyId')}>
              <option value="">No company</option>
              {(companyPage?.items ?? []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="deal-close-date" className="label">
            Expected close date
          </label>
          <input id="deal-close-date" type="date" className="input" {...register('expectedCloseDate')} />
          {errors.expectedCloseDate ? (
            <p className="mt-1 text-sm text-red-600">{errors.expectedCloseDate.message}</p>
          ) : null}
        </div>
        <div>
          <span className="label">Tags</span>
          <TagSelect value={tagIds} onChange={setTagIds} />
        </div>
        <div>
          <label htmlFor="deal-notes" className="label">
            Notes
          </label>
          <textarea id="deal-notes" rows={3} className="input" {...register('notes')} />
        </div>
        <div className="flex items-center justify-between gap-2 pt-2">
          {deal ? (
            <ConfirmButton
              label="Delete deal"
              onConfirm={() => {
                deleteMutation.mutate(deal.id)
                onClose()
              }}
            />
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save deal'}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
