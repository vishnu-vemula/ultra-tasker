import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '../../../shared/components/dialog'
import type { Company } from '../../../shared/types'
import { companyFormSchema, type CompanyFormValues } from '../model/schema'
import { useCreateCompany, useUpdateCompany } from '../hooks/use-company-mutations'

interface CompanyDialogProps {
  company: Company | null
  onClose: () => void
}

function toFormValues(company: Company | null): CompanyFormValues {
  if (!company) return { name: '', domain: '', industry: '' }
  return { name: company.name, domain: company.domain ?? '', industry: company.industry ?? '' }
}

export function CompanyDialog({ company, onClose }: CompanyDialogProps) {
  const createMutation = useCreateCompany()
  const updateMutation = useUpdateCompany()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    values: toFormValues(company),
  })

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      domain: values.domain || undefined,
      industry: values.industry || undefined,
    }
    if (company) {
      await updateMutation.mutateAsync({ id: company.id, input })
    } else {
      await createMutation.mutateAsync(input)
    }
    onClose()
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog title={company ? 'Edit company' : 'New company'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="company-name" className="label">
            Name
          </label>
          <input id="company-name" type="text" className="input" {...register('name')} />
          {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
        <div>
          <label htmlFor="company-domain" className="label">
            Domain
          </label>
          <input id="company-domain" type="text" placeholder="acme.com" className="input" {...register('domain')} />
        </div>
        <div>
          <label htmlFor="company-industry" className="label">
            Industry
          </label>
          <input id="company-industry" type="text" className="input" {...register('industry')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save company'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
