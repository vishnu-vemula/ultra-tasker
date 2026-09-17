import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '../../../shared/components/dialog'
import { CONTACT_SOURCES, CONTACT_STATUSES, type Contact } from '../../../shared/types'
import { contactFormSchema, type ContactFormValues } from '../model/schema'
import { useCreateContact, useSetContactTags, useUpdateContact } from '../hooks/use-contact-mutations'
import { useCompanies } from '../../companies/hooks/use-companies'
import { TagSelect } from '../../tags/components/tag-select'

interface ContactDialogProps {
  contact: Contact | null
  onClose: () => void
}

function toFormValues(contact: Contact | null): ContactFormValues {
  if (!contact) {
    return {
      name: '',
      email: '',
      phone: '',
      position: '',
      status: 'LEAD',
      website: '',
      city: '',
      country: '',
      source: '',
      companyId: '',
      notes: '',
    }
  }
  return {
    name: contact.name,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    position: contact.position ?? '',
    status: contact.status,
    website: contact.website ?? '',
    city: contact.city ?? '',
    country: contact.country ?? '',
    source: contact.source ?? '',
    companyId: contact.companyId ?? '',
    notes: contact.notes ?? '',
  }
}

function sameTagIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id))
}

export function ContactDialog({ contact, onClose }: ContactDialogProps) {
  const { data: companyPage } = useCompanies({ page: 1, pageSize: 100 })
  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()
  const setTagsMutation = useSetContactTags()
  const [tagIds, setTagIds] = useState<string[]>(contact?.tags.map((tag) => tag.id) ?? [])

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
      website: values.website || undefined,
      city: values.city || undefined,
      country: values.country || undefined,
      source: values.source || null,
      companyId: values.companyId || null,
      notes: values.notes || undefined,
    }
    if (contact) {
      const updated = await updateMutation.mutateAsync({ id: contact.id, input })
      if (!sameTagIds(tagIds, updated.tags.map((tag) => tag.id))) {
        await setTagsMutation.mutateAsync({ id: contact.id, tagIds })
      }
    } else {
      const created = await createMutation.mutateAsync(input)
      if (tagIds.length > 0) {
        await setTagsMutation.mutateAsync({ id: created.id, tagIds })
      }
    }
    onClose()
  })

  const submitting = createMutation.isPending || updateMutation.isPending || setTagsMutation.isPending

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-website" className="label">
              Website
            </label>
            <input id="contact-website" type="text" placeholder="acme.com" className="input" {...register('website')} />
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
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="contact-city" className="label">
              City
            </label>
            <input id="contact-city" type="text" className="input" {...register('city')} />
          </div>
          <div>
            <label htmlFor="contact-country" className="label">
              Country
            </label>
            <input id="contact-country" type="text" className="input" {...register('country')} />
          </div>
          <div>
            <label htmlFor="contact-source" className="label">
              Source
            </label>
            <select id="contact-source" className="select" {...register('source')}>
              <option value="">No source</option>
              {CONTACT_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source
                    .split('_')
                    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
                    .join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <span className="label">Tags</span>
          <TagSelect value={tagIds} onChange={setTagIds} />
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
