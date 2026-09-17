import { apiFetch } from '../../../shared/lib/api-client'
import type { Deal, DealDetail, DealItem, DealSource, DealStage, Page, ReorderUpdate } from '../../../shared/types'

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
  probability?: number
  source?: DealSource | null
  nextStep?: string
  lostReason?: string
  contactId?: string | null
  companyId?: string | null
  expectedCloseDate?: string | null
  notes?: string
}

export interface DealItemInput {
  productId?: string | null
  description: string
  quantity: number
  unitPrice: number
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

export async function getDealDetail(id: string): Promise<DealDetail> {
  const result = await apiFetch<DealDetail>(`/deals/${id}`)
  if (result === null) throw new Error('Unexpected empty response from /deals/:id')
  return result
}

export async function setDealTags(id: string, tagIds: string[]): Promise<Deal> {
  const result = await apiFetch<Deal>(`/deals/${id}/tags`, {
    method: 'PATCH',
    body: JSON.stringify({ tagIds }),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /deals/:id/tags')
  return result
}

export async function createDealItem(dealId: string, input: DealItemInput): Promise<DealItem> {
  const result = await apiFetch<DealItem>(`/deals/${dealId}/items`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /deals/:id/items')
  return result
}

export async function updateDealItem(
  dealId: string,
  itemId: string,
  input: Partial<DealItemInput>,
): Promise<DealItem> {
  const result = await apiFetch<DealItem>(`/deals/${dealId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /deals/:id/items/:itemId')
  return result
}

export async function deleteDealItem(dealId: string, itemId: string): Promise<void> {
  await apiFetch<null>(`/deals/${dealId}/items/${itemId}`, { method: 'DELETE' })
}

export async function reorderDeals(updates: ReorderUpdate[]): Promise<Deal[]> {
  const result = await apiFetch<Deal[]>('/deals/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /deals/reorder')
  return result
}
