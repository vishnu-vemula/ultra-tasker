import { apiFetch } from '../../../shared/lib/api-client'
import type { SearchResults } from '../../../shared/types'

export async function searchAll(query: string): Promise<SearchResults> {
  const search = new URLSearchParams({ q: query })
  const result = await apiFetch<SearchResults>(`/search?${search.toString()}`)
  if (result === null) throw new Error('Unexpected empty response from /search')
  return result
}
