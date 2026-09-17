import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { updateUserRole } from '../api/users-api'
import type { Role } from '../../../shared/types'

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateUserRole(id, role),
    onSuccess: () => {
      toast.success('Role updated')
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    },
  })
}
