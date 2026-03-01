import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'

export default function Header({ title }) {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { tenant } = useAuthStore()

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-[var(--border)] bg-[var(--bg-card)] sticky top-0 z-20 p-5">
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {tenant?.name || 'No tenant'}
        </span>
      </div>
    </header>
  )
}
