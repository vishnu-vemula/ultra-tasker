import { apiFetch } from '../../../shared/lib/api-client'
import type { Page, Task, TaskPriority, TaskStatus } from '../../../shared/types'

export interface ListTasksParams {
  status?: TaskStatus
  contactId?: string
  dealId?: string
  page?: number
  pageSize?: number
}

export interface TaskInput {
  title: string
  description?: string
  dueDate?: string | null
  status?: TaskStatus
  priority?: TaskPriority | null
  contactId?: string | null
  dealId?: string | null
}

export async function listTasks(params: ListTasksParams): Promise<Page<Task>> {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.contactId) search.set('contactId', params.contactId)
  if (params.dealId) search.set('dealId', params.dealId)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()
  const result = await apiFetch<Page<Task>>(`/tasks${query ? `?${query}` : ''}`)
  if (result === null) throw new Error('Unexpected empty response from /tasks')
  return result
}

export async function createTask(input: TaskInput): Promise<Task> {
  const result = await apiFetch<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /tasks')
  return result
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const result = await apiFetch<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /tasks/:id')
  return result
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch<null>(`/tasks/${id}`, { method: 'DELETE' })
}
