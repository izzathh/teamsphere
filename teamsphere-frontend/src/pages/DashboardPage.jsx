import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import { dashboardAPI, tasksAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { StatCardSkeleton, PageLoader } from '../components/ui/Spinner'
import { formatDate, isOverdue } from '../utils/helpers'

const COLORS = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  done: '#22c55e',
  on_hold: '#f59e0b',
  overdue: '#ef4444',
}

function StatCard({ label, value, icon, accent, sub, loading }) {
  if (loading) return <StatCardSkeleton />
  return (
    <div className={`stat-card border-l-4 ${accent}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        <span className="text-[var(--text-muted)] opacity-60">{icon}</span>
      </div>
      <div className="text-4xl font-display text-[var(--text)] mt-1">{value ?? '—'}</div>
      {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-[var(--text-muted)]">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          dashboardAPI.getStats(),
          tasksAPI.list({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
        ])
        setStats(statsRes.data)
        setRecentTasks(tasksRes.data?.tasks || tasksRes.data?.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tasksByStatus = stats
    ? [
      { name: 'To Do', value: stats.tasksByStatus?.todo || 0, color: COLORS.todo },
      { name: 'In Progress', value: stats.tasksByStatus?.in_progress || 0, color: COLORS.in_progress },
      { name: 'Done', value: stats.tasksByStatus?.done || 0, color: COLORS.done },
      { name: 'On Hold', value: stats.tasksByStatus?.on_hold || 0, color: COLORS.on_hold },
    ]
    : []

  const barData = tasksByStatus.map((d) => ({ name: d.name, Tasks: d.value }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          Good {getGreeting()},{' '}
          <span className="text-amber-500">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="page-subtitle">Here's what's happening in your workspace today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          loading={loading}
          label="Total Projects"
          value={stats?.totalProjects}
          accent="border-amber-500"
          icon={<ProjectIcon />}
          sub={`${stats?.activeProjects || 0} active`}
        />
        <StatCard
          loading={loading}
          label="Total Tasks"
          value={stats?.totalTasks}
          accent="border-blue-500"
          icon={<TaskIcon />}
          sub={`${stats?.tasksByStatus?.in_progress || 0} in progress`}
        />
        <StatCard
          loading={loading}
          label="Completed"
          value={stats?.tasksByStatus?.done}
          accent="border-green-500"
          icon={<CheckIcon />}
          sub="tasks done"
        />
        <StatCard
          loading={loading}
          label="Overdue"
          value={stats?.overdueCount}
          accent="border-red-500"
          icon={<AlertIcon />}
          sub="need attention"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-base font-display mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Tasks" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={Object.values(COLORS)[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-display mb-4">Distribution</h2>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="shimmer w-32 h-32 rounded-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tasksByStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-[var(--text-muted)]">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-display">Recent Tasks</h2>
          <Link to="/tasks" className="btn-ghost text-xs">View all →</Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="h-4 w-1/3 shimmer rounded" />
                <div className="h-4 w-16 shimmer rounded" />
                <div className="h-4 w-20 shimmer rounded" />
              </div>
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4 text-center">No tasks yet. Create one to get started!</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <Link to={`/tasks/${task._id}`} className="font-medium hover:text-amber-600 transition-colors">
                        {task.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge-${task.status}`}>{task.status?.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className={`badge-${task.priority}`}>{task.priority}</span>
                    </td>
                    <td>
                      <span className={task.dueDate && isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-500 text-xs font-medium' : 'text-[var(--text-muted)] text-xs'}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const ProjectIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
)
const TaskIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
