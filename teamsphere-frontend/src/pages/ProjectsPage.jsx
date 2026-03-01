import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { projectsAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { useToast } from '../hooks/useToast'
import { useDebounce } from '../hooks/useDebounce'
import { usePagination } from '../hooks/usePagination'
import { formatDate, extractError, STATUS_LABELS } from '../utils/helpers'
import { PageLoader, SkeletonRow } from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ProjectFormModal from '../components/projects/ProjectFormModal'

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const toast = useToast()
  const canManage = ['admin', 'manager'].includes(user?.role)

  const [projects, setProjects] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const debouncedSearch = useDebounce(search)
  const { page, limit, setPage, reset } = usePagination(1, 10)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await projectsAPI.list({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter || undefined,
      })
      const d = res.data
      setProjects(d.projects || d.data || [])
      setTotalItems(d.total || d.totalItems || 0)
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { reset() }, [debouncedSearch, statusFilter])

  const handleDelete = async () => {
    try {
      await projectsAPI.delete(deleteTarget._id)
      toast.success('Project deleted')
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
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage your team's projects and track progress.</p>
        </div>
        {canManage && (
          <button
            className="btn-accent"
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="input max-w-xs"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper border-0 rounded-none">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Members</th>
                <th>Created</th>
                {canManage && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonRow key={i} cols={canManage ? 5 : 4} />)
                : projects.map((project) => (
                  <tr key={project._id}>
                    <td>
                      <Link
                        to={`/projects/${project._id}`}
                        className="font-medium text-[var(--text)] hover:text-amber-600 transition-colors"
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-xs">
                          {project.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className={`badge-${project.status}`}>
                        {STATUS_LABELS[project.status] || project.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex -space-x-2">
                        {(project.members || []).slice(0, 4).map((m, i) => (
                          <div
                            key={m._id || i}
                            className="w-7 h-7 rounded-full bg-amber-200 border-2 border-white dark:border-[var(--bg-card)] flex items-center justify-center text-xs font-semibold text-amber-800"
                            title={m.name}
                          >
                            {(m.name || '?').charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {project.members?.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] border-2 border-white dark:border-[var(--bg-card)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                            +{project.members.length - 4}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-[var(--text-muted)] text-xs">{formatDate(project.createdAt)}</td>
                    {canManage && (
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-ghost px-2 py-1 text-xs"
                            onClick={() => { setEditTarget(project); setFormOpen(true) }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-ghost px-2 py-1 text-xs text-red-500 hover:text-red-700"
                            onClick={() => setDeleteTarget(project)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && projects.length === 0 && (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
            title="No projects yet"
            description={canManage ? 'Create your first project to get started.' : 'No projects have been created yet.'}
            action={canManage && (
              <button className="btn-accent" onClick={() => setFormOpen(true)}>
                Create Project
              </button>
            )}
          />
        )}

        <div className="px-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} limit={limit} />
        </div>
      </div>

      <ProjectFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={load}
        project={editTarget}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
