import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getFirebaseAuth } from '../../shared/lib/firebase'
import { postSession } from './api/auth-api'
import { AuthContext, type AuthContextValue } from './auth-context'
import type { User } from '../../shared/types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    let auth
    try {
      auth = getFirebaseAuth()
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Firebase failed to initialize')
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        try {
          const synced = await postSession()
          setProfile(synced)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      role: profile?.role ?? null,
      loading,
      configError,
      signOut: async () => {
        await firebaseSignOut(getFirebaseAuth())
      },
    }),
    [firebaseUser, profile, loading, configError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
