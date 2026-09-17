import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { Role, User } from '../../shared/types'

export interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  profile: User | null
  role: Role | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
