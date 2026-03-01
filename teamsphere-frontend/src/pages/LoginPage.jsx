import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuthStore from '../store/authStore'
import { authAPI } from '../services/api'
import { extractError } from '../utils/helpers'
import { Spinner } from '../components/ui/Spinner'
import FormField, { fieldClass } from '../components/ui/FormField'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableTenants, setAvailableTenants] = useState([])
  const [showTenantSelector, setShowTenantSelector] = useState(false)
  const [currentEmail, setCurrentEmail] = useState('')
  const [currentPass, setCurrentPass] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ mode: 'onTouched' })

  const onSubmit = async (data) => {
    setServerError('')
    setIsSubmitting(true)

    try {
      const emailCheck = await authAPI.validate({ email: data.email })

      if (emailCheck.data.tenants.length === 0) {
        throw new Error('No account found with this email')
      }

      if (emailCheck.data.tenants.length === 1) {
        // Auto-login to single tenant
        data.tenantId = emailCheck.data.tenants[0]._id
        await completeLogin(data)
      } else {
        // Multiple tenants → show selector
        setAvailableTenants(emailCheck.data.tenants)
        setCurrentEmail(data.email)
        setCurrentPass(data.password)
        setShowTenantSelector(true)
      }
    } catch (err) {
      setServerError(extractError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const completeLogin = async (data) => {
    const res = await authAPI.login(data)
    const { user, accessToken, refreshToken, tenant } = res.data
    setAuth({ user, accessToken, refreshToken, tenant })
    navigate('/dashboard')
  }

  const selectTenant = async (tenantId) => {
    setIsSubmitting(true)
    setSelectedTenant(tenantId)
    try {
      await completeLogin({
        email: currentEmail,
        password: currentPass,
        tenantId
      })
    } catch (err) {
      setServerError(extractError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    setShowTenantSelector(false)
    setAvailableTenants([])
    setCurrentEmail('')
    setCurrentPass('')
    reset()
  }

  return (
    <div className="min-h-screen dot-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500 rounded-2xl shadow-brutal mb-4">
            <span className="text-white font-display text-2xl font-bold">TS</span>
          </div>
          <h1 className="text-3xl font-display text-[var(--text)]">Welcome back</h1>
          <p className="text-[var(--text-muted)] mt-1">Sign in to your TeamSphere workspace</p>
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

          {showTenantSelector ? (
            // Tenant Selector UI
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-[var(--text)] mb-1">
                  Select Workspace
                </h2>
                <p className="text-[var(--text-muted)] text-sm">
                  {currentEmail}
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableTenants.map((tenant) => (
                  <button
                    key={tenant._id}
                    onClick={() => selectTenant(tenant._id)}
                    disabled={isSubmitting}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">
                        {tenant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text)] truncate group-hover:underline">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {tenant._id.slice(-6)}
                      </p>
                    </div>
                    {isSubmitting && tenant._id === selectedTenant && (
                      <Spinner size="sm" className="opacity-50" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={goBack}
                disabled={isSubmitting}
                className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-2"
              >
                ← Back to email/password
              </button>
            </div>
          ) : (
            // Original Login Form
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <FormField label="Email" required error={errors.email}>
                <input
                  type="email"
                  className={fieldClass(errors.email)}
                  placeholder="you@company.com"
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

              <FormField label="Password" required error={errors.password}>
                <input
                  type="password"
                  className={fieldClass(errors.password)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
              </FormField>

              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Spinner size="sm" />}
                {isSubmitting ? 'Checking…' : 'Sign In'}
              </button>
            </form>
          )}

          {!showTenantSelector && (
            <p className="text-center text-sm text-[var(--text-muted)] mt-6">
              New organization?{' '}
              <Link to="/register" className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">
                Register here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}