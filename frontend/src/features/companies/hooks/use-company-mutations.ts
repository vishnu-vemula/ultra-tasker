import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { createCompany, deleteCompany, updateCompany, type CompanyInput } from '../api/companies-api'

function notifyError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CompanyInput) => createCompany(input),
    onSuccess: () => {
      toast.success('Company saved')
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: notifyError,
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CompanyInput> }) => updateCompany(id, input),
    onSuccess: () => {
      toast.success('Company saved')
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: notifyError,
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      toast.success('Company deleted')
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: notifyError,
  })
}
