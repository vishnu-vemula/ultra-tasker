import { History } from 'lucide-react'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import type { AuditAction, AuditEntityType } from '../types'
import { timeAgo } from '../lib/format'
import { useAudit } from '../hooks/use-audit'

const actionStyles: Record<AuditAction, 'success' | 'info' | 'danger' | 'violet'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  STAGE_CHANGE: 'violet',
}

interface AuditSectionProps {
  entityType: AuditEntityType
  entityId: string
}

export function AuditSection({ entityType, entityId }: AuditSectionProps) {
  const { data, isLoading } = useAudit({ entityType, entityId, limit: 50 })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-4 py-2.5">
                <div className="flex min-w-0 items-start gap-3">
                  <Badge variant={actionStyles[entry.action]} className="shrink-0">
                    {entry.action.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-foreground">{entry.summary}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
