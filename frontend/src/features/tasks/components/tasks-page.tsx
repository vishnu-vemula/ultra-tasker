import { useMemo, useState } from 'react'
import { CheckSquare, ChevronLeft, ChevronRight, Plus, Square } from 'lucide-react'
import clsx from 'clsx'
import { useTasks } from '../hooks/use-tasks'
import { useDeleteTask, useToggleTaskStatus } from '../hooks/use-task-mutations'
import { TaskDialog } from './task-dialog'
import { PageHeader } from '../../../shared/components/page-header'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { StatusBadge } from '../../../shared/components/status-badge'
import { Button } from '../../../shared/components/ui/button'
import { Card } from '../../../shared/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table'
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
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        }
      />
      <div className="mb-4">
        <Select
          value={status || 'ALL'}
          onValueChange={(value) => {
            setStatus(value === 'ALL' ? '' : (value as TaskStatus))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {TASK_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {value
                  .split('_')
                  .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
                  .join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Add your first task to get started."
          action={
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New task
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12" />
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Deal</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(task)}
                >
                  <TableCell>
                    <button
                      type="button"
                      aria-label={task.status === 'DONE' ? 'Mark as to do' : 'Mark as done'}
                      className="text-muted-foreground/70 transition-colors hover:text-primary"
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
                  </TableCell>
                  <TableCell>
                    <span
                      className={clsx(
                        'font-medium text-foreground',
                        task.status === 'DONE' && 'line-through',
                      )}
                    >
                      {task.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={task.status} />
                  </TableCell>
                  <TableCell>
                    {task.priority ? <StatusBadge variant={task.priority} /> : '—'}
                  </TableCell>
                  <TableCell className={clsx(isOverdue(task) && 'font-medium text-destructive')}>
                    {formatDate(task.dueDate)}
                    {isOverdue(task) ? ' (overdue)' : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{task.contact?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{task.deal?.title ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(task.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {total} task{total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
      {dialogOpen ? <TaskDialog task={editing} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
