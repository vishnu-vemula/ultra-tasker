import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { toast } from 'react-toastify'
import { FirebaseError } from 'firebase/app'
import { auth } from '../../../firebase'
import { signupSchema, type SignupFormValues } from '../model/schema'
import { postSession } from '../api/auth-api'

export function SignupForm() {
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password)
      await updateProfile(credential.user, { displayName: values.name })
      await postSession(values.name)
    } catch (error) {
      const message = error instanceof FirebaseError ? error.message : 'Failed to create account'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className="label">
          Name
        </label>
        <input id="signup-name" type="text" autoComplete="name" className="input" {...register('name')} />
        {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
      </div>
      <div>
        <label htmlFor="signup-email" className="label">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          className="input"
          {...register('email')}
        />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>
      <div>
        <label htmlFor="signup-password" className="label">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          className="input"
          {...register('password')}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
