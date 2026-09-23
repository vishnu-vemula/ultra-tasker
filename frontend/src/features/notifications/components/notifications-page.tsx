import { AlarmClock, CheckCheck, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { Button } from '../../../shared/components/ui/button'
import { Card } from '../../../shared/components/ui/card'
import { timeAgo } from '../../../shared/lib/format'
import type { Notification, NotificationType } from '../../../shared/types'
import { useNotifications } from '../hooks/use-notifications'
import { useMarkNotificationsRead } from '../hooks/use-mark-read'

const typeIcons: Record<NotificationType, typeof AlarmClock> = {
  TASK_OVERDUE: AlarmClock,
  DEAL_WON: Trophy,
}

interface NotificationRowProps {
  notification: Notification
  onMarkRead: (id: string) => void
  marking: boolean
}

function NotificationRow({ notification, onMarkRead, marking }: NotificationRowProps) {
  const Icon = typeIcons[notification.type]
  const unread = notification.readAt === null

  return (
    <li
      className={clsx(
        'flex items-start gap-4 px-4 py-4',
        unread ? 'bg-primary/5' : 'bg-card',
      )}
    >
      <span
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          unread ? 'bg-primary/20' : 'bg-secondary',
        )}
      >
        <Icon className={clsx('h-4 w-4', unread ? 'text-primary' : 'text-muted-foreground')} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={clsx('text-sm', unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
          {notification.title}
        </p>
        {notification.body ? <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p> : null}
        <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(notification.createdAt)}</p>
      </div>
      {unread ? (
        <Button
          type="button"
          variant="outline"
          className="h-auto shrink-0 px-2.5 py-1.5 text-xs"
          disabled={marking}
          onClick={() => onMarkRead(notification.id)}
        >
          Mark read
        </Button>
      ) : null}
    </li>
  )
}

export function NotificationsPage() {
  const { data, isLoading } = useNotifications()
  const markReadMutation = useMarkNotificationsRead()

  const unread = data?.unread ?? 0

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Alerts about overdue tasks and won deals"
        action={
          unread > 0 ? (
            <Button
              type="button"
              variant="outline"
              disabled={markReadMutation.isPending}
              onClick={() => markReadMutation.mutate({ all: true })}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />
      {isLoading ? (
        <SkeletonList count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={AlarmClock}
          title="No notifications"
          description="You are all caught up. New alerts will show up here."
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {data.items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              marking={markReadMutation.isPending}
              onMarkRead={(id) => markReadMutation.mutate({ ids: [id] })}
            />
          ))}
        </Card>
      )}
    </div>
  )
}
