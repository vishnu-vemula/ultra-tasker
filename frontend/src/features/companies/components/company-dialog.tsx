import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog } from '../../../shared/components/dialog'
import { Button } from '../../../shared/components/ui/button'
import { Input } from '../../../shared/components/ui/input'
import { Label } from '../../../shared/components/ui/label'
import { Textarea } from '../../../shared/components/ui/textarea'
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
        <div className="space-y-2">
          <Label htmlFor="company-name">Name</Label>
          <Input id="company-name" type="text" {...register('name')} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-domain">Domain</Label>
            <Input id="company-domain" type="text" placeholder="acme.com" {...register('domain')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-industry">Industry</Label>
            <Input id="company-industry" type="text" {...register('industry')} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="company-phone">Phone</Label>
            <Input id="company-phone" type="tel" {...register('phone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-city">City</Label>
            <Input id="company-city" type="text" {...register('city')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-country">Country</Label>
            <Input id="company-country" type="text" {...register('country')} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-employees">Employee count</Label>
            <Input id="company-employees" type="number" min="0" step="1" {...register('employeeCount')} />
            {errors.employeeCount ? (
              <p className="text-sm text-destructive">{errors.employeeCount.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-revenue">Annual revenue</Label>
            <Input id="company-revenue" type="number" min="0" step="any" {...register('annualRevenue')} />
            {errors.annualRevenue ? (
              <p className="text-sm text-destructive">{errors.annualRevenue.message}</p>
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-notes">Notes</Label>
          <Textarea id="company-notes" rows={3} {...register('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Saving…' : 'Save company'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
