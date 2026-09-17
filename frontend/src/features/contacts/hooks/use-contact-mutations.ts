import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { createContact, deleteContact, setContactTags, updateContact, type ContactInput } from '../api/contacts-api'

function notifyError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

function useInvalidateContacts() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['contacts'] })
    void queryClient.invalidateQueries({ queryKey: ['contact'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useCreateContact() {
  const invalidate = useInvalidateContacts()
  return useMutation({
    mutationFn: (input: ContactInput) => createContact(input),
    onSuccess: () => {
      toast.success('Contact saved')
      invalidate()
    },
    onError: notifyError,
  })
}

export function useUpdateContact() {
  const invalidate = useInvalidateContacts()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ContactInput> }) => updateContact(id, input),
    onSuccess: () => {
      toast.success('Contact saved')
      invalidate()
    },
    onError: notifyError,
  })
}

export function useSetContactTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tagIds }: { id: string; tagIds: string[] }) => setContactTags(id, tagIds),
    onSuccess: () => {
      toast.success('Tags updated')
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['contact'] })
    },
    onError: notifyError,
  })
}

export function useDeleteContact() {
  const invalidate = useInvalidateContacts()
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted')
      invalidate()
    },
    onError: notifyError,
  })
}
