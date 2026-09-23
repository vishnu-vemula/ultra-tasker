'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FullPageSpinner } from '@/src/shared/components/full-page-spinner'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return <FullPageSpinner />
}
