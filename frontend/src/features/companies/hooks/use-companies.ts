import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCompanyDetail, listCompanies, type ListCompaniesParams } from '../api/companies-api'

export function useCompanies(params: ListCompaniesParams) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => listCompanies(params),
    placeholderData: keepPreviousData,
  })
}

export function useCompanyDetail(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => getCompanyDetail(id),
    enabled: id.length > 0,
  })
}
