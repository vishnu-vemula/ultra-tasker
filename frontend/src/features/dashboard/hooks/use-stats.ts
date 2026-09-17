import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/dashboard-api'

export function useStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getStats,
  })
}
