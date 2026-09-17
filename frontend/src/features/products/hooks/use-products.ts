import { useQuery } from '@tanstack/react-query'
import { listProducts, type ListProductsParams } from '../api/products-api'

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
  })
}
