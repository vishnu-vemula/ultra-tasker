import { useQuery } from '@tanstack/react-query'
import { listNotifications } from '../api/notifications-api'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    refetchInterval: 60000,
  })
}
