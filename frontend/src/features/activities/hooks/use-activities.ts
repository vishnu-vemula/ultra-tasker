import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listActivities, type ListActivitiesParams } from '../api/activities-api'

export function useActivities(params: ListActivitiesParams) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => listActivities(params),
    placeholderData: keepPreviousData,
  })
}
