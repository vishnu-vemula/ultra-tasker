import type { ReactNode } from 'react'
import type { LayoutDashboard } from 'lucide-react'
import { Card } from './ui/card'

interface EmptyStateProps {
  icon?: typeof LayoutDashboard
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed shadow-none">
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        {Icon ? (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </span>
        ) : null}
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
        {action}
      </div>
    </Card>
  )
}
