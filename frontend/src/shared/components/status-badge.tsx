import clsx from 'clsx'
import type { ContactStatus, DealStage, TaskPriority, TaskStatus } from '../types'
import { titleCase } from '../lib/format'

export type BadgeVariant = ContactStatus | DealStage | TaskStatus | TaskPriority | string

const variantClasses: Record<string, string> = {
  LEAD: 'bg-slate-100 text-slate-700',
  QUALIFIED: 'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-emerald-100 text-emerald-700',
  CHURNED: 'bg-rose-100 text-rose-700',
  NEW: 'bg-slate-100 text-slate-700',
  PROPOSAL: 'bg-violet-100 text-violet-700',
  NEGOTIATION: 'bg-amber-100 text-amber-700',
  WON: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-rose-100 text-rose-700',
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
}

interface StatusBadgeProps {
  variant: BadgeVariant
}

export function StatusBadge({ variant }: StatusBadgeProps) {
  return (
    <span className={clsx('badge', variantClasses[variant] ?? 'bg-slate-100 text-slate-700')}>
      {variant ? titleCase(variant) : '—'}
    </span>
  )
}
