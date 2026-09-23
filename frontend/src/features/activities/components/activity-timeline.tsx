import { Calendar, FileText, Mail, Phone } from 'lucide-react'
import type { Activity, ActivityType } from '../../../shared/types'
import { timeAgo, titleCase } from '../../../shared/lib/format'
import { Badge } from '../../../shared/components/ui/badge'

const typeIcons: Record<ActivityType, typeof FileText> = {
  NOTE: FileText,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Calendar,
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activities logged yet.</p>
  }

  return (
    <ol className="relative space-y-6 before:absolute before:bottom-3 before:left-[1.125rem] before:top-3 before:w-px before:bg-border">
      {activities.map((activity) => {
        const Icon = typeIcons[activity.type]
        return (
          <li key={activity.id} className="relative flex gap-4">
            <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <Badge variant="muted">{titleCase(activity.type)}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                {timeAgo(activity.occurredAt)}
                {activity.durationMin !== null ? ` · ${activity.durationMin} min` : ''}
              </p>
              {activity.body ? (
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{activity.body}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
