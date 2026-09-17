import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { createCompany, deleteCompany, updateCompany, type CompanyInput } from '../api/companies-api'

function notifyError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

function useInvalidateCompanies() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['companies'] })
    void queryClient.invalidateQueries({ queryKey: ['company'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useCreateCompany() {
  const invalidate = useInvalidateCompanies()
  return useMutation({
    mutationFn: (input: CompanyInput) => createCompany(input),
    onSuccess: () => {
      toast.success('Company saved')
      invalidate()
    },
    onError: notifyError,
  })
}

export function useUpdateCompany() {
  const invalidate = useInvalidateCompanies()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CompanyInput> }) => updateCompany(id, input),
    onSuccess: () => {
      toast.success('Company saved')
      invalidate()
    },
    onError: notifyError,
  })
}

export function useDeleteCompany() {
  const invalidate = useInvalidateCompanies()
  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      toast.success('Company deleted')
      invalidate()
    },
    onError: notifyError,
  })
}
