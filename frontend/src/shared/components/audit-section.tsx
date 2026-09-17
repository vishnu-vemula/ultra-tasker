import clsx from 'clsx'
import { History } from 'lucide-react'
import type { AuditAction, AuditEntityType } from '../types'
import { timeAgo } from '../lib/format'
import { useAudit } from '../hooks/use-audit'

const actionClasses: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-rose-100 text-rose-700',
  STAGE_CHANGE: 'bg-violet-100 text-violet-700',
}

interface AuditSectionProps {
  entityType: AuditEntityType
  entityId: string
}

export function AuditSection({ entityType, entityId }: AuditSectionProps) {
  const { data, isLoading } = useAudit({ entityType, entityId, limit: 50 })

  return (
    <section className="card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
        <History className="h-4 w-4 text-slate-400" />
        History
      </h2>
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-4 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-slate-500">No history recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-4 py-2.5">
              <div className="flex min-w-0 items-start gap-3">
                <span className={clsx('badge shrink-0', actionClasses[entry.action])}>{entry.action.replace('_', ' ')}</span>
                <p className="text-sm text-slate-700">{entry.summary}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{timeAgo(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
