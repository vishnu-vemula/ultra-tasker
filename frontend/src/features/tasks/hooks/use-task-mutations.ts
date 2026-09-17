import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import type { Page, Task, TaskStatus } from '../../../shared/types'
import { createTask, deleteTask, updateTask, type TaskInput } from '../api/tasks-api'

function notifyError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

function invalidateAll(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['tasks'] })
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskInput) => createTask(input),
    onSuccess: () => {
      toast.success('Task saved')
      invalidateAll(queryClient)
    },
    onError: notifyError,
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskInput> }) => updateTask(id, input),
    onSuccess: () => {
      toast.success('Task saved')
      invalidateAll(queryClient)
    },
    onError: notifyError,
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success('Task deleted')
      invalidateAll(queryClient)
    },
    onError: notifyError,
  })
}

export function useToggleTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTask(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousPages = queryClient.getQueriesData<Page<Task>>({ queryKey: ['tasks'] })
      for (const [key, page] of previousPages) {
        if (!page) continue
        queryClient.setQueryData(key, {
          ...page,
          items: page.items.map((task) =>
            task.id === id
              ? { ...task, status, completedAt: status === 'DONE' ? new Date().toISOString() : null }
              : task,
          ),
        })
      }
      return { previousPages }
    },
    onError: (_error, _variables, context) => {
      for (const [key, page] of context?.previousPages ?? []) {
        queryClient.setQueryData(key, page)
      }
      notifyError(_error)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
