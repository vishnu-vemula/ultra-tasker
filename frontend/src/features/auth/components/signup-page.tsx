import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { useAuth } from '../use-auth'
import { SignupForm } from './signup-form'
import { GoogleButton } from './google-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card'
import { Separator } from '../../../shared/components/ui/separator'

export function SignupPage() {
  const { firebaseUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && firebaseUser) router.replace('/')
  }, [firebaseUser, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg shadow-slate-200/50">
        <CardHeader className="items-center pb-0">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25">
            <Zap className="h-7 w-7 text-white" />
          </span>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Get started with Ultra Tasker</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <SignupForm />
          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground/70">or</span>
            <Separator className="flex-1" />
          </div>
          <GoogleButton />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
