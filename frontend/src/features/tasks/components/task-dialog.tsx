import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog } from '../../../shared/components/dialog'
import { Button } from '../../../shared/components/ui/button'
import { Input } from '../../../shared/components/ui/input'
import { Label } from '../../../shared/components/ui/label'
import { Textarea } from '../../../shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select'
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
    control,
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
        <div className="space-y-2">
          <Label htmlFor="task-title">Title</Label>
          <Input id="task-title" type="text" {...register('title')} />
          {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea id="task-description" rows={3} {...register('description')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-due-date">Due date</Label>
            <Input id="task-due-date" type="date" {...register('dueDate')} />
            {errors.dueDate ? <p className="text-sm text-destructive">{errors.dueDate.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select
                  value={field.value || 'NONE'}
                  onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No priority</SelectItem>
                    {TASK_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0) + priority.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status
                        .split('_')
                        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
                        .join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Contact</Label>
            <Controller
              control={control}
              name="contactId"
              render={({ field }) => (
                <Select
                  value={field.value || 'NONE'}
                  onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No contact</SelectItem>
                    {(contactPage?.items ?? []).map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Deal</Label>
            <Controller
              control={control}
              name="dealId"
              render={({ field }) => (
                <Select
                  value={field.value || 'NONE'}
                  onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No deal</SelectItem>
                    {(dealPage?.items ?? []).map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Saving…' : 'Save task'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
