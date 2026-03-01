import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { projectsAPI, tasksAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { useToast } from '../hooks/useToast'
import { formatDate, extractError, STATUS_LABELS, isOverdue } from '../utils/helpers'
import { PageLoader } from '../components/ui/Spinner'
import TaskFormModal from '../components/tasks/TaskFormModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const toast = useToast()
  const canManage = ['admin', 'manager'].includes(user?.role)

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteTask, setDeleteTask] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [pr, tr] = await Promise.all([
          projectsAPI.getById(id),
          tasksAPI.list({ projectId: id, limit: 50 }),
        ])
        setProject(pr.data)
        setTasks(tr.data?.tasks || tr.data?.data || [])
      } catch (err) {
        toast.error(extractError(err))
        navigate('/projects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const reloadTasks = async () => {
    const tr = await tasksAPI.list({ projectId: id, limit: 50 })
    setTasks(tr.data?.tasks || tr.data?.data || [])
  }

  const handleDeleteTask = async () => {
    try {
      await tasksAPI.delete(deleteTask._id)
      toast.success('Task deleted')
      reloadTasks()
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  if (loading) return <PageLoader />
  if (!project) return null

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="animate-fade-in">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to projects
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="page-title">{project.name}</h1>
            <span className={`badge-${project.status}`}>{STATUS_LABELS[project.status] || project.status}</span>
          </div>
          {project.description && (
            <p className="text-[var(--text-muted)]">{project.description}</p>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-2">Created {formatDate(project.createdAt)}</p>
        </div>
        {canManage && (
          <button className="btn-accent" onClick={() => { setEditTask(null); setTaskModalOpen(true) }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: tasks.length, color: 'border-[var(--border)]' },
          { label: 'In Progress', value: statusCounts.in_progress || 0, color: 'border-blue-400' },
          { label: 'Done', value: statusCounts.done || 0, color: 'border-green-400' },
          { label: 'Overdue', value: tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length, color: 'border-red-400' },
        ].map((s) => (
          <div key={s.label} className={`card p-4 border-l-4 ${s.color}`}>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-display mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Members</p>
        <div className="flex flex-wrap gap-2">
          {(project.members || []).map((m) => (
            <div key={m._id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] text-sm">
              <Avatar name={m.name || '?'} size="xs" />
              <span>{m.name || 'Unknown'}</span>
              <span className={`badge-${m.role} text-[10px]`}>{m.role}</span>
            </div>
          ))}
          {(!project.members || project.members.length === 0) && (
            <p className="text-[var(--text-muted)] text-sm">No members assigned</p>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-display text-base">Tasks ({tasks.length})</h2>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description={canManage ? 'Add the first task to this project.' : 'No tasks have been created for this project.'}
            action={canManage && (
              <button className="btn-accent" onClick={() => setTaskModalOpen(true)}>Add Task</button>
            )}
          />
        ) : (
          <div className="table-wrapper border-0 rounded-none">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned</th>
                  <th>Due</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const overdue = isOverdue(task.dueDate) && task.status !== 'done'
                  return (
                    <tr key={task._id} className={overdue ? 'bg-red-50/50 dark:bg-red-900/5' : ''}>
                      <td className="font-medium">{task.title}</td>
                      <td><span className={`badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                      <td><span className={`badge-${task.priority}`}>{task.priority}</span></td>
                      <td>
                        {task.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={task.assignedTo.name || '?'} size="xs" />
                            <span className="text-xs">{task.assignedTo.name}</span>
                          </div>
                        ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td>
                        <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-[var(--text-muted)]'}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button className="btn-ghost px-2 py-1 text-xs" onClick={() => { setEditTask(task); setTaskModalOpen(true) }}>
                            {user?.role === 'employee' ? 'Update' : 'Edit'}
                          </button>
                          {canManage && (
                            <button className="btn-ghost px-2 py-1 text-xs text-red-500" onClick={() => setDeleteTask(task)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSuccess={reloadTasks}
        task={editTask}
        projectId={id}
      />

      <ConfirmDialog
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Delete "${deleteTask?.title}"?`}
        confirmLabel="Delete"
      />
    </div>
  )
}
