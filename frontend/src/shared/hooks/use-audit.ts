import { useQuery } from '@tanstack/react-query'
import { listAudit, type ListAuditParams } from '../api/audit-api'

export function useAudit(params: ListAuditParams) {
  return useQuery({
    queryKey: ['audit', { entityType: params.entityType, entityId: params.entityId }],
    queryFn: () => listAudit(params),
    enabled: params.entityId !== undefined && params.entityId.length > 0,
  })
}
