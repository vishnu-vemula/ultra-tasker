import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '../../../shared/components/dialog'
import { CONTACT_STATUSES, type Contact } from '../../../shared/types'
import { contactFormSchema, type ContactFormValues } from '../model/schema'
import { useCreateContact, useUpdateContact } from '../hooks/use-contact-mutations'
import { useCompanies } from '../../companies/hooks/use-companies'

interface ContactDialogProps {
  contact: Contact | null
  onClose: () => void
}

function toFormValues(contact: Contact | null): ContactFormValues {
  if (!contact) {
    return { name: '', email: '', phone: '', position: '', status: 'LEAD', companyId: '', notes: '' }
  }
  return {
    name: contact.name,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    position: contact.position ?? '',
    status: contact.status,
    companyId: contact.companyId ?? '',
    notes: contact.notes ?? '',
  }
}

export function ContactDialog({ contact, onClose }: ContactDialogProps) {
  const { data: companyPage } = useCompanies({ page: 1, pageSize: 100 })
  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    values: toFormValues(contact),
  })

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      position: values.position || undefined,
      status: values.status,
      companyId: values.companyId || null,
      notes: values.notes || undefined,
    }
    if (contact) {
      await updateMutation.mutateAsync({ id: contact.id, input })
    } else {
      await createMutation.mutateAsync(input)
    }
    onClose()
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog title={contact ? 'Edit contact' : 'New contact'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="label">
            Name
          </label>
          <input id="contact-name" type="text" className="input" {...register('name')} />
          {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-email" className="label">
              Email
            </label>
            <input id="contact-email" type="email" className="input" {...register('email')} />
            {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
          </div>
          <div>
            <label htmlFor="contact-phone" className="label">
              Phone
            </label>
            <input id="contact-phone" type="tel" className="input" {...register('phone')} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-position" className="label">
              Position
            </label>
            <input id="contact-position" type="text" className="input" {...register('position')} />
          </div>
          <div>
            <label htmlFor="contact-status" className="label">
              Status
            </label>
            <select id="contact-status" className="select" {...register('status')}>
              {CONTACT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="contact-company" className="label">
            Company
          </label>
          <select id="contact-company" className="select" {...register('companyId')}>
            <option value="">No company</option>
            {(companyPage?.items ?? []).map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="contact-notes" className="label">
            Notes
          </label>
          <textarea id="contact-notes" rows={3} className="input" {...register('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save contact'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
