import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal'
import { tasksAPI, projectsAPI, usersAPI } from '../../services/api'
import { extractError, TASK_PRIORITIES, TASK_STATUSES } from '../../utils/helpers'
import { Spinner } from '../ui/Spinner'
import { useToast } from '../../hooks/useToast'
import useAuthStore from '../../store/authStore'
import FormField, { fieldClass } from '../ui/FormField'

export default function TaskFormModal({ isOpen, onClose, onSuccess, task, projectId }) {
  const toast = useToast()
  const { user } = useAuthStore()
  const isEdit = !!task
  const isEmployee = user?.role === 'employee'
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: task
      ? {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.slice(0, 10),
        assignedTo: task.assignedTo?._id || task.assignedTo,
        projectId: task.projectId?._id || task.projectId,
      }
      : {
        status: 'todo',
        priority: 'medium',
        projectId: projectId || '',
      },
  })

  useEffect(() => {
    if (isOpen && !isEmployee) {
      Promise.all([
        projectsAPI.list({ limit: 100 }),
        usersAPI.list({ limit: 100 }),
      ])
        .then(([pr, ur]) => {
          setProjects(pr.data?.projects || pr.data?.data || [])
          setUsers(ur.data?.users || ur.data?.data || [])
        })
        .catch(() => { })
    }
  }, [isOpen, isEmployee])

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.slice(0, 10),
        assignedTo: task.assignedTo?._id || task.assignedTo,
        projectId: task.projectId?._id || task.projectId,
      })
    } else {
      reset({ status: 'todo', priority: 'medium', projectId: projectId || '' })
    }
  }, [task, reset, projectId])

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        if (isEmployee) {
          await tasksAPI.updateStatus(task._id, data.status)
        } else {
          await tasksAPI.update(task._id, data)
        }
        toast.success('Task updated')
      } else {
        await tasksAPI.create(data)
        toast.success('Task created')
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    on_hold: 'On Hold',
  }

  const priorityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Title" required error={errors.title}>
          <input
            className={fieldClass(errors.title)}
            placeholder="e.g. Design landing page"
            disabled={isEdit && isEmployee}
            {...register('title', {
              required: 'Task title is required',
              minLength: { value: 2, message: 'Must be at least 2 characters' },
              maxLength: { value: 300, message: 'Cannot exceed 300 characters' },
            })}
          />
        </FormField>

        {!isEmployee && (
          <FormField label="Description" error={errors.description}>
            <textarea
              className={fieldClass(errors.description)}
              rows={2}
              placeholder="Task details…"
              style={{ resize: 'none' }}
              {...register('description', {
                maxLength: { value: 5000, message: 'Description is too long' },
              })}
            />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Status" required error={errors.status}>
            <select
              className={fieldClass(errors.status)}
              {...register('status', { required: 'Status is required' })}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s] || s}
                </option>
              ))}
            </select>
          </FormField>

          {!isEmployee && (
            <FormField label="Priority" error={errors.priority}>
              <select className={fieldClass(errors.priority)} {...register('priority')}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabels[p] || p}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </div>

        {!isEmployee && (
          <>
            <FormField
              label="Due Date"
              required
              error={errors.dueDate}
            >
              <input
                type="date"
                className={fieldClass(errors.dueDate)}
                {...register('dueDate', {
                  required: 'Due Date is required',
                  validate: (v) => {
                    if (!v) return true
                    return new Date(v) > new Date('2000-01-01') || 'Please enter a valid date'
                  },
                })}
              />
            </FormField>

            <FormField label="Assign To" error={errors.assignedTo} required>
              <select className={fieldClass(errors.assignedTo)} {
                ...register('assignedTo', {
                  required: 'Assigned To is required',
                })

              }>
                <option value="">— Unassigned —</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </FormField>

            {!projectId && (
              <FormField label="Project" error={errors.projectId} required>
                <select className={fieldClass(errors.projectId)} {...register('projectId', {
                  required: 'Project is required',
                })}>
                  <option value="">— No project —</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="sm" />}
            {isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
