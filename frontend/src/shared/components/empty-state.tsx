import type { ReactNode } from 'react'
import type { LayoutDashboard } from 'lucide-react'

interface EmptyStateProps {
  icon?: typeof LayoutDashboard
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-3 p-12 text-center">
      {Icon ? <Icon className="h-10 w-10 text-slate-300" /> : null}
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      {action}
    </div>
  )
}
