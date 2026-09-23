import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { useAuth } from '../use-auth'
import { SignupForm } from './signup-form'
import { GoogleButton } from './google-button'

export function SignupPage() {
  const { firebaseUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && firebaseUser) router.replace('/')
  }, [firebaseUser, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Zap className="h-7 w-7 text-white" />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">Get started with Ultra Tasker</p>
        </div>
        <SignupForm />
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleButton />
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
