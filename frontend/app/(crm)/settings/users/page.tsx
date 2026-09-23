'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/features/auth/use-auth'
import { UsersPage } from '@/src/features/users/components/users-page'
import { FullPageSpinner } from '@/src/shared/components/full-page-spinner'

export default function UsersRoute() {
  const { role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && role !== 'ADMIN') router.replace('/')
  }, [loading, role, router])

  if (loading || role !== 'ADMIN') return <FullPageSpinner />

  return <UsersPage />
}
