import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listUsers, type ListUsersParams } from '../api/users-api'

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  })
}
