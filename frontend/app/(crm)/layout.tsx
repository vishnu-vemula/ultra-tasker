'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/features/auth/use-auth'
import { AppShell } from '@/src/shared/components/app-shell'
import { FullPageSpinner } from '@/src/shared/components/full-page-spinner'

export default function CrmLayout({ children }: { children: ReactNode }) {
  const { firebaseUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace('/login')
  }, [firebaseUser, loading, router])

  if (loading || !firebaseUser) return <FullPageSpinner />

  return <AppShell>{children}</AppShell>
}
