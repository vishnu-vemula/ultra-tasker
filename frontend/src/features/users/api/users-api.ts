import { apiFetch } from '../../../shared/lib/api-client'
import type { Page, Role, User } from '../../../shared/types'

export interface ListUsersParams {
  search?: string
  page?: number
  pageSize?: number
}

export async function listUsers(params: ListUsersParams): Promise<Page<User>> {
  const search = new URLSearchParams()
  if (params.search) search.set('search', params.search)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()
  const result = await apiFetch<Page<User>>(`/users${query ? `?${query}` : ''}`)
  if (result === null) throw new Error('Unexpected empty response from /users')
  return result
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  const result = await apiFetch<User>(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /users/:id/role')
  return result
}
