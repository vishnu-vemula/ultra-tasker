import { apiFetch } from '../../../shared/lib/api-client'
import type { Notification } from '../../../shared/types'

export interface NotificationsPayload {
  items: Notification[]
  unread: number
}

export interface MarkReadInput {
  ids?: string[]
  all?: boolean
}

export async function listNotifications(): Promise<NotificationsPayload> {
  const result = await apiFetch<NotificationsPayload>('/notifications')
  if (result === null) throw new Error('Unexpected empty response from /notifications')
  return result
}

export async function markNotificationsRead(input: MarkReadInput): Promise<NotificationsPayload> {
  const result = await apiFetch<NotificationsPayload>('/notifications/read', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /notifications/read')
  return result
}
