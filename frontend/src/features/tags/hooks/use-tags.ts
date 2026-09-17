import { useQuery } from '@tanstack/react-query'
import { listTags } from '../api/tags-api'

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: listTags,
  })
}
