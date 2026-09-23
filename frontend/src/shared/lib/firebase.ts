import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const requiredKeys: Array<[string, string | undefined]> = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
  ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
]

if (typeof window !== 'undefined' && requiredKeys.some(([, value]) => !value)) {
  const missing = requiredKeys.filter(([, value]) => !value).map(([key]) => key)
  console.error(
    `Firebase is not configured. Missing environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in your Firebase project credentials.',
  )
}

let authInstance: Auth | undefined

export function getFirebaseAuth(): Auth {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  authInstance ??= getAuth(app)
  return authInstance
}

export const googleProvider = new GoogleAuthProvider()
