import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlarmClock, Bell, CheckCheck, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { timeAgo } from '../../../shared/lib/format'
import type { NotificationType } from '../../../shared/types'
import { useNotifications } from '../hooks/use-notifications'
import { useMarkNotificationsRead } from '../hooks/use-mark-read'

const typeIcons: Record<NotificationType, typeof Bell> = {
  TASK_OVERDUE: AlarmClock,
  DEAL_WON: Trophy,
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { data } = useNotifications()
  const markReadMutation = useMarkNotificationsRead()

  const unread = data?.unread ?? 0
  const latest = (data?.items ?? []).slice(0, 5)

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-ghost relative px-2.5 py-2"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 z-50 mt-2 w-80 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              {unread > 0 ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  disabled={markReadMutation.isPending}
                  onClick={() => markReadMutation.mutate({ all: true })}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              ) : null}
            </div>
            {latest.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">You are all caught up.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {latest.map((notification) => {
                  const Icon = typeIcons[notification.type]
                  const isUnread = notification.readAt === null
                  return (
                    <li key={notification.id} className={clsx('flex items-start gap-3 px-4 py-3', isUnread && 'bg-indigo-50/50')}>
                      <span
                        className={clsx(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          isUnread ? 'bg-indigo-100' : 'bg-slate-100',
                        )}
                      >
                        <Icon className={clsx('h-4 w-4', isUnread ? 'text-indigo-600' : 'text-slate-500')} />
                      </span>
                      <div className="min-w-0">
                        <p className={clsx('truncate text-sm', isUnread ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-400">{timeAgo(notification.createdAt)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link
              to="/notifications"
              className="block border-t border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-indigo-600 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}
