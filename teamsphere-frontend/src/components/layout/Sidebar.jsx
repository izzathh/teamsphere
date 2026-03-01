import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import Avatar from '../ui/Avatar'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    roles: ['admin', 'manager', 'employee'],
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    roles: ['admin', 'manager', 'employee'],
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    roles: ['admin', 'manager', 'employee'],
  },
  {
    to: '/users',
    label: 'Team',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin', 'manager'],
  },
]

export default function Sidebar() {
  const { user, tenant, logout, isAuthenticated } = useAuthStore()
  const { sidebarOpen, toggleTheme, theme } = useUIStore()
  const navigate = useNavigate()

  const userRole = user?.role || 'employee'
  const visibleNav = navItems.filter((n) => n.roles.includes(userRole))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col z-30 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'
        }`}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)] shrink-0">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0 shadow-brutal-sm">
          <span className="text-white font-display text-sm font-bold">TS</span>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="font-display text-[var(--text)] font-bold text-base leading-none">TeamSphere</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate max-w-[130px]">
              {tenant?.name || 'Organization'}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${sidebarOpen ? '' : 'justify-center px-2'}`
            }
            title={!sidebarOpen ? item.label : undefined}
          >
            {item.icon}
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-[var(--border)] space-y-1 shrink-0">
        <button
          onClick={toggleTheme}
          className={`sidebar-link w-full ${sidebarOpen ? '' : 'justify-center px-2'}`}
          title={!sidebarOpen ? 'Toggle theme' : undefined}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {sidebarOpen && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''} ${sidebarOpen ? '' : 'justify-center px-2'}`
          }
          title={!sidebarOpen ? 'Settings' : undefined}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {sidebarOpen && <span>Settings</span>}
        </NavLink>

        <div className={`flex items-center gap-2 px-3 py-2 mt-1 rounded-lg bg-[var(--bg-subtle)] ${!sidebarOpen ? 'justify-center' : ''}`}>
          <Avatar name={user?.name || 'U'} size="sm" />
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[var(--text)] truncate">{user?.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] capitalize">{user?.role}</div>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-muted)] transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
