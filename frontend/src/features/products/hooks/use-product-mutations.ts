import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { createProduct, deleteProduct, updateProduct, type ProductInput } from '../api/products-api'

function notifyError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: () => {
      toast.success('Product saved')
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: notifyError,
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) => updateProduct(id, input),
    onSuccess: () => {
      toast.success('Product saved')
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: notifyError,
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted')
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: notifyError,
  })
}
