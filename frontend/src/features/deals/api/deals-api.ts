import { apiFetch } from '../../../shared/lib/api-client'
import type { Deal, DealStage, Page, ReorderUpdate } from '../../../shared/types'

export interface ListDealsParams {
  stage?: DealStage
  contactId?: string
  companyId?: string
  search?: string
  sort?: 'position' | 'recent'
  page?: number
  pageSize?: number
}

export interface DealInput {
  title: string
  value: number
  stage?: DealStage
  currency?: string
  contactId?: string | null
  companyId?: string | null
  expectedCloseDate?: string | null
  notes?: string
}

export async function listDeals(params: ListDealsParams): Promise<Page<Deal>> {
  const search = new URLSearchParams()
  if (params.stage) search.set('stage', params.stage)
  if (params.contactId) search.set('contactId', params.contactId)
  if (params.companyId) search.set('companyId', params.companyId)
  if (params.search) search.set('search', params.search)
  if (params.sort) search.set('sort', params.sort)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()
  const result = await apiFetch<Page<Deal>>(`/deals${query ? `?${query}` : ''}`)
  if (result === null) throw new Error('Unexpected empty response from /deals')
  return result
}

export async function createDeal(input: DealInput): Promise<Deal> {
  const result = await apiFetch<Deal>('/deals', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /deals')
  return result
}

export async function updateDeal(id: string, input: Partial<DealInput>): Promise<Deal> {
  const result = await apiFetch<Deal>(`/deals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /deals/:id')
  return result
}

export async function deleteDeal(id: string): Promise<void> {
  await apiFetch<null>(`/deals/${id}`, { method: 'DELETE' })
}

export async function reorderDeals(updates: ReorderUpdate[]): Promise<Deal[]> {
  const result = await apiFetch<Deal[]>('/deals/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /deals/reorder')
  return result
}
