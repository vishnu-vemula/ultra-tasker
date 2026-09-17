import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getContactDetail, listContacts, type ListContactsParams } from '../api/contacts-api'

export function useContacts(params: ListContactsParams) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => listContacts(params),
    placeholderData: keepPreviousData,
  })
}

export function useContactDetail(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContactDetail(id),
    enabled: id.length > 0,
  })
}
