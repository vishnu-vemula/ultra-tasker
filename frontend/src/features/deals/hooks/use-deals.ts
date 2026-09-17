import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDealDetail, listDeals, type ListDealsParams } from '../api/deals-api'

export function useDeals(params: ListDealsParams) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => listDeals({ pageSize: 100, ...params }),
    placeholderData: keepPreviousData,
  })
}

export function useDealDetail(id: string) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: () => getDealDetail(id),
    enabled: id.length > 0,
  })
}
