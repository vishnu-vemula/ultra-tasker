import { apiFetch } from '../../../shared/lib/api-client'
import type { DashboardStats } from '../../../shared/types'

export async function getStats(): Promise<DashboardStats> {
  const result = await apiFetch<DashboardStats>('/dashboard/stats')
  if (result === null) throw new Error('Unexpected empty response from /dashboard/stats')
  return result
}
