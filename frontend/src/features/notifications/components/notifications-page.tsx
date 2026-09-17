import { AlarmClock, CheckCheck, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
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
        unread ? 'bg-indigo-50/50' : 'bg-white',
      )}
    >
      <span
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          unread ? 'bg-indigo-100' : 'bg-slate-100',
        )}
      >
        <Icon className={clsx('h-4 w-4', unread ? 'text-indigo-600' : 'text-slate-500')} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={clsx('text-sm', unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>
          {notification.title}
        </p>
        {notification.body ? <p className="mt-0.5 text-sm text-slate-500">{notification.body}</p> : null}
        <p className="mt-1 text-xs text-slate-400">{timeAgo(notification.createdAt)}</p>
      </div>
      {unread ? (
        <button
          type="button"
          className="btn-secondary shrink-0 px-2.5 py-1.5 text-xs"
          disabled={marking}
          onClick={() => onMarkRead(notification.id)}
        >
          Mark read
        </button>
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
            <button
              type="button"
              className="btn-secondary"
              disabled={markReadMutation.isPending}
              onClick={() => markReadMutation.mutate({ all: true })}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
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
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {data.items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              marking={markReadMutation.isPending}
              onMarkRead={(id) => markReadMutation.mutate({ ids: [id] })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
