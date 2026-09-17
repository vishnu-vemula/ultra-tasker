import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listCompanies, type ListCompaniesParams } from '../api/companies-api'

export function useCompanies(params: ListCompaniesParams) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => listCompanies(params),
    placeholderData: keepPreviousData,
  })
}
