import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { createContact, deleteContact, updateContact, type ContactInput } from '../api/contacts-api'

function isApiError(error: unknown): error is { message: string } {
  return error instanceof Error
}

function notifyError(error: unknown) {
  toast.error(isApiError(error) ? error.message : 'Something went wrong')
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ContactInput) => createContact(input),
    onSuccess: () => {
      toast.success('Contact saved')
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: notifyError,
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ContactInput> }) => updateContact(id, input),
    onSuccess: () => {
      toast.success('Contact saved')
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: notifyError,
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted')
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: notifyError,
  })
}
