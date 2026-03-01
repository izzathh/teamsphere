import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return '—'
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export const formatRelative = (date) => {
  if (!date) return '—'
  try {
    return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, {
      addSuffix: true,
    })
  } catch {
    return '—'
  }
}

export const isOverdue = (dueDate) => {
  if (!dueDate) return false
  try {
    return isPast(typeof dueDate === 'string' ? parseISO(dueDate) : dueDate)
  } catch {
    return false
  }
}

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const getAvatarColor = (name = '') => {
  const colors = [
    'bg-purple-200 text-purple-800',
    'bg-blue-200 text-blue-800',
    'bg-green-200 text-green-800',
    'bg-amber-200 text-amber-800',
    'bg-rose-200 text-rose-800',
    'bg-teal-200 text-teal-800',
    'bg-indigo-200 text-indigo-800',
    'bg-orange-200 text-orange-800',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export const cn = (...classes) => classes.filter(Boolean).join(' ')

export const extractError = (err) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Something went wrong'
  )
}

export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'on_hold']
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical']
export const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'archived']
export const ROLES = ['admin', 'manager', 'employee']

export const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  on_hold: 'On Hold',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
}

export const PRIORITY_COLORS = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}
