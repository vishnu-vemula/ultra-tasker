import { Badge } from './ui/badge'
import type { ContactStatus, DealStage, TaskPriority, TaskStatus } from '../types'
import { titleCase } from '../lib/format'

export type BadgeVariant = ContactStatus | DealStage | TaskStatus | TaskPriority | string

type BadgeStyle =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'violet'
  | 'muted'

const variantStyles: Record<string, BadgeStyle> = {
  LEAD: 'muted',
  QUALIFIED: 'info',
  CUSTOMER: 'success',
  CHURNED: 'danger',
  NEW: 'muted',
  PROPOSAL: 'violet',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'danger',
  TODO: 'muted',
  IN_PROGRESS: 'info',
  DONE: 'success',
  LOW: 'muted',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'destructive',
}

interface StatusBadgeProps {
  variant: BadgeVariant
}

export function StatusBadge({ variant }: StatusBadgeProps) {
  return (
    <Badge variant={variant ? variantStyles[variant] ?? 'muted' : 'muted'}>
      {variant ? titleCase(variant) : '—'}
    </Badge>
  )
}
