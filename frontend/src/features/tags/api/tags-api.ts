import { apiFetch } from '../../../shared/lib/api-client'
import type { Tag } from '../../../shared/types'

export interface TagInput {
  name: string
  color?: string
}

export interface TagsList {
  items: Tag[]
  total: number
}

export async function listTags(): Promise<TagsList> {
  const result = await apiFetch<TagsList>('/tags')
  if (result === null) throw new Error('Unexpected empty response from /tags')
  return result
}

export async function createTag(input: TagInput): Promise<Tag> {
  const result = await apiFetch<Tag>('/tags', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /tags')
  return result
}

export async function updateTag(id: string, input: Partial<TagInput>): Promise<Tag> {
  const result = await apiFetch<Tag>(`/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /tags/:id')
  return result
}

export async function deleteTag(id: string): Promise<void> {
  await apiFetch<null>(`/tags/${id}`, { method: 'DELETE' })
}
