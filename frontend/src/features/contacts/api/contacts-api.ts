import { apiFetch } from '../../../shared/lib/api-client'
import type { Contact, ContactStatus, Page } from '../../../shared/types'

export interface ListContactsParams {
  search?: string
  status?: ContactStatus | ''
  companyId?: string
  page?: number
  pageSize?: number
}

export interface ContactInput {
  name: string
  email?: string
  phone?: string
  position?: string
  status?: ContactStatus
  companyId?: string | null
  notes?: string
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listContacts(params: ListContactsParams): Promise<Page<Contact>> {
  const query = toQueryString({
    search: params.search,
    status: params.status,
    companyId: params.companyId,
    page: params.page,
    pageSize: params.pageSize,
  })
  const result = await apiFetch<Page<Contact>>(`/contacts${query}`)
  if (result === null) throw new Error('Unexpected empty response from /contacts')
  return result
}

export async function getContact(id: string): Promise<Contact> {
  const result = await apiFetch<Contact>(`/contacts/${id}`)
  if (result === null) throw new Error('Unexpected empty response from /contacts/:id')
  return result
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const result = await apiFetch<Contact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /contacts')
  return result
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<Contact> {
  const result = await apiFetch<Contact>(`/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /contacts/:id')
  return result
}

export async function deleteContact(id: string): Promise<void> {
  await apiFetch<null>(`/contacts/${id}`, { method: 'DELETE' })
}
