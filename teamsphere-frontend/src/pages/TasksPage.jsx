import { useState, useEffect, useCallback } from 'react'
import { tasksAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { useToast } from '../hooks/useToast'
import { useDebounce } from '../hooks/useDebounce'
import { usePagination } from '../hooks/usePagination'
import { formatDate, isOverdue, extractError, STATUS_LABELS } from '../utils/helpers'
import { SkeletonRow } from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TaskFormModal from '../components/tasks/TaskFormModal'
import Avatar from '../components/ui/Avatar'

export default function TasksPage() {
  const { user } = useAuthStore()
  const toast = useToast()
  const canManage = ['admin', 'manager'].includes(user?.role)

  const [tasks, setTasks] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const debouncedSearch = useDebounce(search)
  const { page, limit, setPage, reset } = usePagination(1, 12)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await tasksAPI.list({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        overdue: overdueOnly ? true : undefined,
      })
      const d = res.data
      setTasks(d.tasks || d.data || [])
      setTotalItems(d.total || d.totalItems || 0)
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, priorityFilter, overdueOnly])

  useEffect(() => { load() }, [load])
  useEffect(() => { reset() }, [debouncedSearch, statusFilter, priorityFilter, overdueOnly])

  const handleDelete = async () => {
    try {
      await tasksAPI.delete(deleteTarget._id)
      toast.success('Task deleted')
      load()
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  const totalPages = Math.ceil(totalItems / limit)

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Track and manage all tasks across projects.</p>
        </div>
        {canManage && (
          <button
            className="btn-accent"
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="input max-w-xs"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="on_hold">On Hold</option>
        </select>
        <select className="input w-36" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-[var(--text-muted)] px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors">
          <input
            type="checkbox"
            className="accent-amber-500"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          Overdue only
        </label>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-[var(--text-muted)]">
        <span>{totalItems} task{totalItems !== 1 ? 's' : ''}</span>
        {overdueOnly && <span className="badge-overdue">Overdue filter active</span>}
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper border-0 rounded-none">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(6)].map((_, i) => <SkeletonRow key={i} cols={6} />)
                : tasks.map((task) => {
                  const overdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'done'
                  return (
                    <tr key={task._id} className={overdue ? 'bg-red-50/50 dark:bg-red-900/5' : ''}>
                      <td>
                        <div className="font-medium">{task.title}</div>
                        {task.projectId && (
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {task.projectId.name || 'Project'}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge-${task.status}`}>{STATUS_LABELS[task.status] || task.status}</span>
                      </td>
                      <td>
                        <span className={`badge-${task.priority}`}>{task.priority}</span>
                      </td>
                      <td>
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={task.assignedTo.name || '?'} size="xs" />
                            <span className="text-xs">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {task.dueDate ? (
                          <span className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-[var(--text-muted)]'}`}>
                            {overdue && '⚠ '}{formatDate(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-ghost px-2 py-1 text-xs"
                            onClick={() => { setEditTarget(task); setFormOpen(true) }}
                          >
                            {user?.role === 'employee' ? 'Update' : 'Edit'}
                          </button>
                          {canManage && (
                            <button
                              className="btn-ghost px-2 py-1 text-xs text-red-500 hover:text-red-700"
                              onClick={() => setDeleteTarget(task)}
                            >
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

        {!loading && tasks.length === 0 && (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            title="No tasks found"
            description={canManage ? 'Create your first task to start tracking work.' : 'No tasks match your filters.'}
            action={canManage && (
              <button className="btn-accent" onClick={() => setFormOpen(true)}>
                Create Task
              </button>
            )}
          />
        )}

        <div className="px-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} limit={limit} />
        </div>
      </div>

      <TaskFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={load}
        task={editTarget}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
