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
  if (!company) {
    return {
      name: '',
      domain: '',
      industry: '',
      phone: '',
      city: '',
      country: '',
      employeeCount: '',
      annualRevenue: '',
      notes: '',
    }
  }
  return {
    name: company.name,
    domain: company.domain ?? '',
    industry: company.industry ?? '',
    phone: company.phone ?? '',
    city: company.city ?? '',
    country: company.country ?? '',
    employeeCount: company.employeeCount !== null ? String(company.employeeCount) : '',
    annualRevenue: company.annualRevenue !== null ? String(company.annualRevenue) : '',
    notes: company.notes ?? '',
  }
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
      phone: values.phone || undefined,
      city: values.city || undefined,
      country: values.country || undefined,
      employeeCount: values.employeeCount ? Number(values.employeeCount) : null,
      annualRevenue: values.annualRevenue ? Number(values.annualRevenue) : null,
      notes: values.notes || undefined,
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="company-phone" className="label">
              Phone
            </label>
            <input id="company-phone" type="tel" className="input" {...register('phone')} />
          </div>
          <div>
            <label htmlFor="company-city" className="label">
              City
            </label>
            <input id="company-city" type="text" className="input" {...register('city')} />
          </div>
          <div>
            <label htmlFor="company-country" className="label">
              Country
            </label>
            <input id="company-country" type="text" className="input" {...register('country')} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="company-employees" className="label">
              Employee count
            </label>
            <input id="company-employees" type="number" min="0" step="1" className="input" {...register('employeeCount')} />
            {errors.employeeCount ? <p className="mt-1 text-sm text-red-600">{errors.employeeCount.message}</p> : null}
          </div>
          <div>
            <label htmlFor="company-revenue" className="label">
              Annual revenue
            </label>
            <input id="company-revenue" type="number" min="0" step="any" className="input" {...register('annualRevenue')} />
            {errors.annualRevenue ? <p className="mt-1 text-sm text-red-600">{errors.annualRevenue.message}</p> : null}
          </div>
        </div>
        <div>
          <label htmlFor="company-notes" className="label">
            Notes
          </label>
          <textarea id="company-notes" rows={3} className="input" {...register('notes')} />
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
