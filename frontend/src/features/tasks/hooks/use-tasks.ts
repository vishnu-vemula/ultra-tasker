import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listTasks, type ListTasksParams } from '../api/tasks-api'

export function useTasks(params: ListTasksParams) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => listTasks(params),
    placeholderData: keepPreviousData,
  })
}
