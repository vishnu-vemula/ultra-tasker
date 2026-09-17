import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listDeals, type ListDealsParams } from '../api/deals-api'

export function useDeals(params: ListDealsParams) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => listDeals({ pageSize: 100, ...params }),
    placeholderData: keepPreviousData,
  })
}
