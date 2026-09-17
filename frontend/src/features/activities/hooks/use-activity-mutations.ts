import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { createActivity, deleteActivity, updateActivity, type ActivityInput } from '../api/activities-api'

function notifyError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

function useInvalidateActivities() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['activities'] })
    void queryClient.invalidateQueries({ queryKey: ['contacts'] })
    void queryClient.invalidateQueries({ queryKey: ['contact'] })
    void queryClient.invalidateQueries({ queryKey: ['deals'] })
    void queryClient.invalidateQueries({ queryKey: ['deal'] })
  }
}

export function useCreateActivity() {
  const invalidate = useInvalidateActivities()
  return useMutation({
    mutationFn: (input: ActivityInput) => createActivity(input),
    onSuccess: () => {
      toast.success('Activity logged')
      invalidate()
    },
    onError: notifyError,
  })
}

export function useUpdateActivity() {
  const invalidate = useInvalidateActivities()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ActivityInput> }) => updateActivity(id, input),
    onSuccess: () => {
      toast.success('Activity saved')
      invalidate()
    },
    onError: notifyError,
  })
}

export function useDeleteActivity() {
  const invalidate = useInvalidateActivities()
  return useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => {
      toast.success('Activity deleted')
      invalidate()
    },
    onError: notifyError,
  })
}
