import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '../../../shared/components/dialog'
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from '../../../shared/types'
import { taskFormSchema, type TaskFormValues } from '../model/schema'
import { useCreateTask, useUpdateTask } from '../hooks/use-task-mutations'
import { useContacts } from '../../contacts/hooks/use-contacts'
import { useDeals } from '../../deals/hooks/use-deals'

interface TaskDialogProps {
  task: Task | null
  onClose: () => void
}

function toFormValues(task: Task | null): TaskFormValues {
  if (!task) {
    return { title: '', description: '', dueDate: '', status: 'TODO', priority: '', contactId: '', dealId: '' }
  }
  return {
    title: task.title,
    description: task.description ?? '',
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    status: task.status,
    priority: task.priority ?? '',
    contactId: task.contactId ?? '',
    dealId: task.dealId ?? '',
  }
}

export function TaskDialog({ task, onClose }: TaskDialogProps) {
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const { data: contactPage } = useContacts({ page: 1, pageSize: 100 })
  const { data: dealPage } = useDeals({ page: 1, pageSize: 100 })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    values: toFormValues(task),
  })

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      title: values.title,
      description: values.description || undefined,
      dueDate: values.dueDate || null,
      status: values.status,
      priority: values.priority ? values.priority : null,
      contactId: values.contactId || null,
      dealId: values.dealId || null,
    }
    if (task) {
      await updateMutation.mutateAsync({ id: task.id, input })
    } else {
      await createMutation.mutateAsync(input)
    }
    onClose()
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="label">
            Title
          </label>
          <input id="task-title" type="text" className="input" {...register('title')} />
          {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
        </div>
        <div>
          <label htmlFor="task-description" className="label">
            Description
          </label>
          <textarea id="task-description" rows={3} className="input" {...register('description')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-due-date" className="label">
              Due date
            </label>
            <input id="task-due-date" type="date" className="input" {...register('dueDate')} />
            {errors.dueDate ? <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p> : null}
          </div>
          <div>
            <label htmlFor="task-priority" className="label">
              Priority
            </label>
            <select id="task-priority" className="select" {...register('priority')}>
              <option value="">No priority</option>
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0) + priority.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="task-status" className="label">
            Status
          </label>
          <select id="task-status" className="select" {...register('status')}>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status
                  .split('_')
                  .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
                  .join(' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-contact" className="label">
              Contact
            </label>
            <select id="task-contact" className="select" {...register('contactId')}>
              <option value="">No contact</option>
              {(contactPage?.items ?? []).map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-deal" className="label">
              Deal
            </label>
            <select id="task-deal" className="select" {...register('dealId')}>
              <option value="">No deal</option>
              {(dealPage?.items ?? []).map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save task'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
