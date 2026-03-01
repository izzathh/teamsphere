import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { usersAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { useToast } from '../hooks/useToast'
import { extractError } from '../utils/helpers'
import { SkeletonRow } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import { Spinner } from '../components/ui/Spinner'
import FormField, { fieldClass } from '../components/ui/FormField'

function InviteModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ mode: 'onTouched' })

  const onSubmit = async (data) => {
    try {
      await usersAPI.invite(data)
      toast.success('Invitation sent!')
      reset()
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Full Name" required error={errors.name}>
          <input
            className={fieldClass(errors.name)}
            placeholder="Jane Smith"
            autoComplete="name"
            {...register('name', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'Must be at least 2 characters' },
            })}
          />
        </FormField>

        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            className={fieldClass(errors.email)}
            placeholder="jane@company.com"
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

        <FormField label="Role" error={errors.role}>
          <select className={fieldClass(errors.role)} {...register('role')}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </FormField>

        <FormField
          label="Temporary Password"
          required
          error={errors.password}
          hint="Member can change this after first login"
        >
          <input
            type="password"
            className={fieldClass(errors.password)}
            placeholder="Min. 8 characters"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="sm" />}
            Invite Member
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const toast = useToast()
  const isAdmin = currentUser?.role === 'admin'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [roleEdit, setRoleEdit] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await usersAPI.list({ limit: 100 })
      setUsers(res.data?.users || res.data?.data || [])
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    try {
      await usersAPI.delete(deleteTarget._id)
      toast.success('User removed')
      load()
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.update(userId, { role: newRole })
      toast.success('Role updated')
      load()
      setRoleEdit(null)
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  const roleBadge = (role) => <span className={`badge-${role}`}>{role}</span>

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage team members and their roles.</p>
        </div>
        {isAdmin && (
          <button className="btn-accent" onClick={() => setInviteOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper border-0 rounded-none">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Email</th>
                <th>Joined</th>
                {isAdmin && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(4)].map((_, i) => <SkeletonRow key={i} cols={isAdmin ? 5 : 4} />)
                : users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <div>
                            <div className="font-medium text-sm">
                              {u.name}
                              {u._id === currentUser?._id && (
                                <span className="ml-2 text-xs text-[var(--text-muted)]">(you)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isAdmin && roleEdit === u._id ? (
                          <select
                            className="input w-32 text-xs py-1"
                            defaultValue={u.role}
                            autoFocus
                            onBlur={() => setRoleEdit(null)}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <button
                            className="text-left"
                            onClick={() => isAdmin && u._id !== currentUser?._id && setRoleEdit(u._id)}
                            title={isAdmin ? 'Click to change role' : undefined}
                          >
                            {roleBadge(u.role)}
                          </button>
                        )}
                      </td>
                      <td className="text-[var(--text-muted)] text-sm">{u.email}</td>
                      <td className="text-[var(--text-muted)] text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="flex justify-end gap-2">
                            {u._id !== currentUser?._id && (
                              <button
                                className="btn-ghost px-2 py-1 text-xs text-red-500 hover:text-red-700"
                                onClick={() => setDeleteTarget(u)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && users.length === 0 && (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            title="No team members"
            description="Invite members to your workspace."
          />
        )}
      </div>

      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={load} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Team Member"
        message={`Remove ${deleteTarget?.name} from the workspace? They'll lose access immediately.`}
        confirmLabel="Remove"
      />
    </div>
  )
}
