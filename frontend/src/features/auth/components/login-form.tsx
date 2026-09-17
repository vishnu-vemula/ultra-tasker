import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { toast } from 'react-toastify'
import { FirebaseError } from 'firebase/app'
import { auth } from '../../../firebase'
import { loginSchema, type LoginFormValues } from '../model/schema'

export function LoginForm() {
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password)
    } catch (error) {
      const message = error instanceof FirebaseError ? error.message : 'Failed to sign in'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="label">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          className="input"
          {...register('email')}
        />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>
      <div>
        <label htmlFor="login-password" className="label">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className="input"
          {...register('password')}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
