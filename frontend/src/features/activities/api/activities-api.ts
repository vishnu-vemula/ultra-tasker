import { apiFetch } from '../../../shared/lib/api-client'
import type { Activity, ActivityType, Page } from '../../../shared/types'

export interface ListActivitiesParams {
  contactId?: string
  dealId?: string
  companyId?: string
  page?: number
  pageSize?: number
}

export interface ActivityInput {
  type: ActivityType
  title: string
  body?: string
  occurredAt?: string
  durationMin?: number | null
  contactId?: string | null
  dealId?: string | null
  companyId?: string | null
}

export async function listActivities(params: ListActivitiesParams): Promise<Page<Activity>> {
  const search = new URLSearchParams()
  if (params.contactId) search.set('contactId', params.contactId)
  if (params.dealId) search.set('dealId', params.dealId)
  if (params.companyId) search.set('companyId', params.companyId)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()
  const result = await apiFetch<Page<Activity>>(`/activities${query ? `?${query}` : ''}`)
  if (result === null) throw new Error('Unexpected empty response from /activities')
  return result
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const result = await apiFetch<Activity>('/activities', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /activities')
  return result
}

export async function updateActivity(id: string, input: Partial<ActivityInput>): Promise<Activity> {
  const result = await apiFetch<Activity>(`/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /activities/:id')
  return result
}

export async function deleteActivity(id: string): Promise<void> {
  await apiFetch<null>(`/activities/${id}`, { method: 'DELETE' })
}
