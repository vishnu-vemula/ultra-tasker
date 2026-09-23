import Link from 'next/link'
import { AlarmClock, Bell, CheckCheck, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../../../shared/components/ui/button'
import { Badge } from '../../../shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../shared/components/ui/dropdown-menu'
import { timeAgo } from '../../../shared/lib/format'
import type { NotificationType } from '../../../shared/types'
import { useNotifications } from '../hooks/use-notifications'
import { useMarkNotificationsRead } from '../hooks/use-mark-read'

const typeIcons: Record<NotificationType, typeof Bell> = {
  TASK_OVERDUE: AlarmClock,
  DEAL_WON: Trophy,
}

export function NotificationsBell() {
  const { data } = useNotifications()
  const markReadMutation = useMarkNotificationsRead()

  const unread = data?.unread ?? 0
  const latest = (data?.items ?? []).slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full px-1 text-[10px]"
            >
              {unread > 9 ? '9+' : unread}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-auto">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>Notifications</span>
          {unread > 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="h-auto gap-1 px-2 py-1 text-xs font-medium text-primary"
              disabled={markReadMutation.isPending}
              onClick={(event) => {
                event.stopPropagation()
                markReadMutation.mutate({ all: true })
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {latest.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">You are all caught up.</p>
        ) : (
          latest.map((notification) => {
            const Icon = typeIcons[notification.type]
            const isUnread = notification.readAt === null
            return (
              <DropdownMenuItem
                key={notification.id}
                className={clsx('items-start gap-3 px-4 py-3', isUnread && 'bg-primary/5')}
              >
                <span
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    isUnread ? 'bg-primary/20' : 'bg-secondary',
                  )}
                >
                  <Icon className={clsx('h-4 w-4', isUnread ? 'text-primary' : 'text-muted-foreground')} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={clsx('truncate text-sm', isUnread ? 'font-semibold text-foreground' : 'text-foreground/80')}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{timeAgo(notification.createdAt)}</p>
                </div>
                {isUnread ? (
                  <span className="ml-auto flex shrink-0 items-center gap-2 pt-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto px-2 py-1 text-xs"
                      disabled={markReadMutation.isPending}
                      onClick={(event) => {
                        event.stopPropagation()
                        markReadMutation.mutate({ ids: [notification.id] })
                      }}
                    >
                      Mark read
                    </Button>
                  </span>
                ) : null}
              </DropdownMenuItem>
            )
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full justify-center text-center text-sm font-medium text-primary">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
