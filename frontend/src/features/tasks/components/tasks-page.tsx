import { useMemo, useState } from 'react'
import { CheckSquare, Plus, Square } from 'lucide-react'
import clsx from 'clsx'
import { useTasks } from '../hooks/use-tasks'
import { useDeleteTask, useToggleTaskStatus } from '../hooks/use-task-mutations'
import { TaskDialog } from './task-dialog'
import { PageHeader } from '../../../shared/components/page-header'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { SkeletonList } from '../../../shared/components/skeleton'
import { StatusBadge } from '../../../shared/components/status-badge'
import { formatDate } from '../../../shared/lib/format'
import { TASK_STATUSES, type Task, type TaskStatus } from '../../../shared/types'

function isOverdue(task: Task): boolean {
  return (
    task.dueDate !== null &&
    task.status !== 'DONE' &&
    new Date(task.dueDate) < new Date()
  )
}

export function TasksPage() {
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const params = useMemo(
    () => ({ status: status || undefined, page, pageSize: 50 }),
    [status, page],
  )
  const { data, isLoading } = useTasks(params)
  const deleteMutation = useDeleteTask()
  const toggleMutation = useToggleTaskStatus()

  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 50
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditing(task)
    setDialogOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Stay on top of your follow-ups"
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New task
          </button>
        }
      />
      <div className="mb-4">
        <select
          className="select w-44"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as TaskStatus | '')
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          {TASK_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value
                .split('_')
                .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
                .join(' ')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : !data || data.items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <CheckSquare className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">No tasks yet. Add your first task to get started.</p>
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New task
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th w-12" />
                <th className="th">Title</th>
                <th className="th">Status</th>
                <th className="th">Priority</th>
                <th className="th">Due date</th>
                <th className="th">Contact</th>
                <th className="th">Deal</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((task) => (
                <tr
                  key={task.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => openEdit(task)}
                >
                  <td className="td">
                    <button
                      type="button"
                      aria-label={task.status === 'DONE' ? 'Mark as to do' : 'Mark as done'}
                      className="text-slate-400 transition-colors hover:text-indigo-600"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleMutation.mutate({
                          id: task.id,
                          status: task.status === 'DONE' ? 'TODO' : 'DONE',
                        })
                      }}
                    >
                      {task.status === 'DONE' ? (
                        <CheckSquare className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className={clsx('td font-medium text-slate-900', task.status === 'DONE' && 'line-through')}>
                    {task.title}
                  </td>
                  <td className="td">
                    <StatusBadge variant={task.status} />
                  </td>
                  <td className="td">
                    {task.priority ? <StatusBadge variant={task.priority} /> : '—'}
                  </td>
                  <td className={clsx('td', isOverdue(task) && 'font-medium text-red-600')}>
                    {formatDate(task.dueDate)}
                    {isOverdue(task) ? ' (overdue)' : ''}
                  </td>
                  <td className="td">{task.contact?.name ?? '—'}</td>
                  <td className="td">{task.deal?.title ?? '—'}</td>
                  <td className="td text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(task.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              {total} task{total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={!canPrev}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={!canNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      {dialogOpen ? <TaskDialog task={editing} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
