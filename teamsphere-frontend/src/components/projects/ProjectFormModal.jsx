import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal'
import { projectsAPI, usersAPI } from '../../services/api'
import { extractError, PROJECT_STATUSES } from '../../utils/helpers'
import { Spinner } from '../ui/Spinner'
import { useToast } from '../../hooks/useToast'
import FormField, { fieldClass } from '../ui/FormField'

export default function ProjectFormModal({ isOpen, onClose, onSuccess, project }) {
  const toast = useToast()
  const isEdit = !!project
  const [users, setUsers] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: project
      ? {
          name: project.name,
          description: project.description,
          status: project.status,
          members: project.members?.map((m) => m._id || m) || [],
        }
      : { status: 'active' },
  })

  useEffect(() => {
    if (isOpen) {
      usersAPI.list({ limit: 100 })
        .then((r) => setUsers(r.data?.users || r.data?.data || []))
        .catch(() => {})
    }
  }, [isOpen])

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description,
        status: project.status,
        members: project.members?.map((m) => m._id || m) || [],
      })
    } else {
      reset({ status: 'active' })
    }
  }, [project, reset])

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await projectsAPI.update(project._id, data)
        toast.success('Project updated successfully')
      } else {
        await projectsAPI.create(data)
        toast.success('Project created successfully')
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Project Name" required error={errors.name}>
          <input
            className={fieldClass(errors.name)}
            placeholder="e.g. Website Redesign"
            {...register('name', {
              required: 'Project name is required',
              minLength: { value: 2, message: 'Must be at least 2 characters' },
              maxLength: { value: 200, message: 'Cannot exceed 200 characters' },
            })}
          />
        </FormField>

        <FormField label="Description" error={errors.description}>
          <textarea
            className={fieldClass(errors.description)}
            rows={3}
            placeholder="What's this project about?"
            style={{ resize: 'none' }}
            {...register('description', {
              maxLength: { value: 2000, message: 'Cannot exceed 2000 characters' },
            })}
          />
        </FormField>

        <FormField label="Status" error={errors.status}>
          <select className={fieldClass(errors.status)} {...register('status')}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Members"
          error={errors.members}
          hint="Hold Ctrl / Cmd to select multiple members"
        >
          <select
            className={fieldClass(errors.members)}
            multiple
            {...register('members')}
            style={{ height: '100px' }}
          >
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="sm" />}
            {isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
