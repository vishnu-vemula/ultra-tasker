import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { createTag, deleteTag, updateTag, type TagInput } from '../api/tags-api'

function notifyError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TagInput) => createTag(input),
    onSuccess: () => {
      toast.success('Tag saved')
      void queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: notifyError,
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TagInput> }) => updateTag(id, input),
    onSuccess: () => {
      toast.success('Tag saved')
      void queryClient.invalidateQueries({ queryKey: ['tags'] })
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['contact'] })
      void queryClient.invalidateQueries({ queryKey: ['deals'] })
      void queryClient.invalidateQueries({ queryKey: ['deal'] })
    },
    onError: notifyError,
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      toast.success('Tag deleted')
      void queryClient.invalidateQueries({ queryKey: ['tags'] })
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['contact'] })
      void queryClient.invalidateQueries({ queryKey: ['deals'] })
      void queryClient.invalidateQueries({ queryKey: ['deal'] })
    },
    onError: notifyError,
  })
}
