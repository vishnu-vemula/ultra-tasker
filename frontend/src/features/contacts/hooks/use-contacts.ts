import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listContacts, type ListContactsParams } from '../api/contacts-api'

export function useContacts(params: ListContactsParams) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => listContacts(params),
    placeholderData: keepPreviousData,
  })
}
