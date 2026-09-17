import { apiFetch } from '../../../shared/lib/api-client'
import type { User } from '../../../shared/types'

export async function postSession(displayName?: string): Promise<User> {
  const result = await apiFetch<User>('/auth/session', {
    method: 'POST',
    body: JSON.stringify(displayName ? { displayName } : {}),
  })
  if (result === null) throw new Error('Unexpected empty response from /auth/session')
  return result
}
