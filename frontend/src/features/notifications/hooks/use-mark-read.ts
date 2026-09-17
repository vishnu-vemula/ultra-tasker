import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { markNotificationsRead, type MarkReadInput } from '../api/notifications-api'

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MarkReadInput) => markNotificationsRead(input),
    onSuccess: (payload) => {
      queryClient.setQueryData(['notifications'], payload)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    },
  })
}
