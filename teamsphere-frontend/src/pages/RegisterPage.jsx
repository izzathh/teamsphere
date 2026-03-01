import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuthStore from '../store/authStore'
import { authAPI } from '../services/api'
import { extractError } from '../utils/helpers'
import { Spinner } from '../components/ui/Spinner'
import FormField, { fieldClass } from '../components/ui/FormField'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' })

  const password = watch('password')

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const res = await authAPI.register({
        tenantName: data.tenantName,
        name: data.name,
        email: data.email,
        password: data.password,
      })
      const { user, accessToken, refreshToken, tenant } = res.data
      setAuth({ user, accessToken, refreshToken, tenant })
      navigate('/dashboard')
    } catch (err) {
      setServerError(extractError(err))
    }
  }

  return (
    <div className="min-h-screen dot-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500 rounded-2xl shadow-brutal mb-4">
            <span className="text-white font-display text-2xl font-bold">TS</span>
          </div>
          <h1 className="text-3xl font-display text-[var(--text)]">Create your workspace</h1>
          <p className="text-[var(--text-muted)] mt-1">Start your team's journey with TeamSphere</p>
        </div>

        <div className="card-brutal p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {serverError && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FormField label="Organization Name" required error={errors.tenantName}>
              <input
                className={fieldClass(errors.tenantName)}
                placeholder="Acme Inc."
                autoComplete="organization"
                {...register('tenantName', {
                  required: 'Organization name is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                  maxLength: { value: 100, message: 'Cannot exceed 100 characters' },
                })}
              />
            </FormField>

            <FormField label="Your Full Name" required error={errors.name}>
              <input
                className={fieldClass(errors.name)}
                placeholder="Jane Smith"
                autoComplete="name"
                {...register('name', {
                  required: 'Your name is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                })}
              />
            </FormField>

            <FormField label="Email" required error={errors.email}>
              <input
                type="email"
                className={fieldClass(errors.email)}
                placeholder="jane@acme.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
            </FormField>

            <FormField
              label="Password"
              required
              error={errors.password}
              hint="Must be at least 8 characters"
            >
              <input
                type="password"
                className={fieldClass(errors.password)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
              />
            </FormField>

            <FormField label="Confirm Password" required error={errors.confirmPassword}>
              <input
                type="password"
                className={fieldClass(errors.confirmPassword)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
            </FormField>

            <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-lg p-3">
              You'll be the <strong>Admin</strong> of this organization and can invite your team members after setup.
            </p>

            <button
              type="submit"
              className="btn-accent w-full justify-center py-3 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Spinner size="sm" />}
              {isSubmitting ? 'Creating workspace…' : 'Create Workspace'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
