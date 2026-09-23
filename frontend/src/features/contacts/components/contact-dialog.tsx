import { useState } from 'react'
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
    control,
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
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" type="text" {...register('name')} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" {...register('email')} />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input id="contact-phone" type="tel" {...register('phone')} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-position">Position</Label>
            <Input id="contact-position" type="text" {...register('position')} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-website">Website</Label>
            <Input id="contact-website" type="text" placeholder="acme.com" {...register('website')} />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Controller
              control={control}
              name="companyId"
              render={({ field }) => (
                <Select
                  value={field.value || 'NONE'}
                  onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No company</SelectItem>
                    {(companyPage?.items ?? []).map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="contact-city">City</Label>
            <Input id="contact-city" type="text" {...register('city')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-country">Country</Label>
            <Input id="contact-country" type="text" {...register('country')} />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <Select
                  value={field.value || 'NONE'}
                  onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No source</SelectItem>
                    {CONTACT_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source
                          .split('_')
                          .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
                          .join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tags</Label>
          <TagSelect value={tagIds} onChange={setTagIds} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-notes">Notes</Label>
          <Textarea id="contact-notes" rows={3} {...register('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Saving…' : 'Save contact'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
