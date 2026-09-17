import { apiFetch } from '../lib/api-client'
import type { AuditEntityType, AuditEntry } from '../types'

export interface ListAuditParams {
  entityType?: AuditEntityType
  entityId?: string
  limit?: number
}

export async function listAudit(params: ListAuditParams): Promise<AuditEntry[]> {
  const search = new URLSearchParams()
  if (params.entityType) search.set('entityType', params.entityType)
  if (params.entityId) search.set('entityId', params.entityId)
  if (params.limit) search.set('limit', String(params.limit))
  const query = search.toString()
  const result = await apiFetch<{ items: AuditEntry[] }>(`/audit${query ? `?${query}` : ''}`)
  if (result === null) throw new Error('Unexpected empty response from /audit')
  return result.items
}
