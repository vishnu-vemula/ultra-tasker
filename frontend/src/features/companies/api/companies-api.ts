import { apiFetch } from '../../../shared/lib/api-client'
import type { Company, CompanyDetail, Page } from '../../../shared/types'

export interface ListCompaniesParams {
  search?: string
  page?: number
  pageSize?: number
}

export interface CompanyInput {
  name: string
  domain?: string
  industry?: string
  phone?: string
  city?: string
  country?: string
  employeeCount?: number | null
  annualRevenue?: number | null
  notes?: string
}

export async function listCompanies(params: ListCompaniesParams): Promise<Page<Company>> {
  const search = new URLSearchParams()
  if (params.search) search.set('search', params.search)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()
  const result = await apiFetch<Page<Company>>(`/companies${query ? `?${query}` : ''}`)
  if (result === null) throw new Error('Unexpected empty response from /companies')
  return result
}

export async function getCompanyDetail(id: string): Promise<CompanyDetail> {
  const result = await apiFetch<CompanyDetail>(`/companies/${id}`)
  if (result === null) throw new Error('Unexpected empty response from /companies/:id')
  return result
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  const result = await apiFetch<Company>('/companies', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /companies')
  return result
}

export async function updateCompany(id: string, input: Partial<CompanyInput>): Promise<Company> {
  const result = await apiFetch<Company>(`/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /companies/:id')
  return result
}

export async function deleteCompany(id: string): Promise<void> {
  await apiFetch<null>(`/companies/${id}`, { method: 'DELETE' })
}
