import { useState } from 'react'
import { useForm } from 'react-hook-form'
import useAuthStore from '../store/authStore'
import { usersAPI } from '../services/api'
import { extractError } from '../utils/helpers'
import { useToast } from '../hooks/useToast'
import { Spinner } from '../components/ui/Spinner'
import Avatar from '../components/ui/Avatar'
import FormField, { fieldClass } from '../components/ui/FormField'

export default function SettingsPage() {
  const { user, tenant, updateUser } = useAuthStore()
  const toast = useToast()
  const [tab, setTab] = useState('profile')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { name: user?.name, email: user?.email },
  })

  const {
    register: pwReg,
    handleSubmit: pwSubmit,
    reset: pwReset,
    watch: pwWatch,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm({ mode: 'onTouched' })

  const onProfileSave = async (data) => {
    try {
      const res = await usersAPI.update(user._id, { name: data.name })
      updateUser({ ...user, name: res.data?.name || data.name })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  const onPasswordChange = async (data) => {
    try {
      await usersAPI.update(user._id, { password: data.newPassword, currentPassword: data.currentPassword })
      toast.success('Password changed')
      pwReset()
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  const newPw = pwWatch('newPassword')

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'workspace', label: 'Workspace' },
  ]

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and workspace preferences.</p>
      </div>

      <div className="flex gap-1 bg-[var(--bg-subtle)] p-1 rounded-lg mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${tab === t.id
                ? 'bg-[var(--bg-card)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} size="xl" />
            <div>
              <h3 className="font-display text-lg">{user?.name}</h3>
              <p className="text-[var(--text-muted)] text-sm">{user?.email}</p>
              <span className={`badge-${user?.role} mt-1 inline-block`}>{user?.role}</span>
            </div>
          </div>

          <hr className="border-[var(--border)]" />

          <form onSubmit={handleSubmit(onProfileSave)} noValidate className="space-y-4">
            <FormField label="Display Name" required error={errors.name}>
              <input
                className={fieldClass(errors.name)}
                autoComplete="name"
                {...register('name', {
                  required: 'Display name is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                  maxLength: { value: 100, message: 'Cannot exceed 100 characters' },
                })}
              />
            </FormField>
            <FormField label="Email" hint="Email address cannot be changed.">
              <input className="input opacity-60 cursor-not-allowed" disabled value={user?.email} readOnly />
            </FormField>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Spinner size="sm" />}
              Save Changes
            </button>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="card p-6 animate-fade-in">
          <h2 className="font-display text-lg mb-4">Change Password</h2>
          <form onSubmit={pwSubmit(onPasswordChange)} noValidate className="space-y-4">
            <FormField label="Current Password" required error={pwErrors.currentPassword}>
              <input
                type="password"
                className={fieldClass(pwErrors.currentPassword)}
                autoComplete="current-password"
                placeholder="Your current password"
                {...pwReg('currentPassword', {
                  required: 'Current password is required',
                })}
              />
            </FormField>
            <FormField
              label="New Password"
              required
              error={pwErrors.newPassword}
              hint="Must be at least 8 characters"
            >
              <input
                type="password"
                className={fieldClass(pwErrors.newPassword)}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                {...pwReg('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
              />
            </FormField>
            <FormField label="Confirm New Password" required error={pwErrors.confirmPassword}>
              <input
                type="password"
                className={fieldClass(pwErrors.confirmPassword)}
                autoComplete="new-password"
                placeholder="Repeat new password"
                {...pwReg('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (v) => v === newPw || 'Passwords do not match',
                })}
              />
            </FormField>
            <button type="submit" className="btn-primary" disabled={pwSubmitting}>
              {pwSubmitting && <Spinner size="sm" />}
              Update Password
            </button>
          </form>
        </div>
      )}

      {tab === 'workspace' && (
        <div className="card p-6 space-y-4 animate-fade-in">
          <h2 className="font-display text-lg mb-2">Workspace Info</h2>

          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Organization" value={tenant?.name} />
            <InfoItem label="Tenant ID" value={tenant?._id} mono />
            <InfoItem label="Your Role" value={user?.role} capitalize />
            <InfoItem label="Plan" value={tenant?.plan || 'Free'} capitalize />
          </div>

          <hr className="border-[var(--border)]" />

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              Multi-Tenant Header
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Every API request includes this header for tenant isolation:
            </p>
            <code className="text-xs font-mono bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded text-amber-800 dark:text-amber-300">
              X-Tenant-ID: {tenant?._id || 'your-tenant-id'}
            </code>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value, mono, capitalize }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`text-sm text-[var(--text)] ${mono ? 'font-mono text-xs' : ''} ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}
