import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import useUIStore from '../../store/uiStore'
import ToastContainer from '../ui/Toast'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/users': 'Team',
  '/settings': 'Settings',
}

export default function AppLayout() {
  const { sidebarOpen } = useUIStore()
  const { pathname } = useLocation()
  const title = pageTitles[pathname] || 'TeamSphere'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-h-screen overflow-auto transition-all duration-300 ${
          sidebarOpen ? 'ml-60' : 'ml-16'
        }`}
      >
        <Header title={title} />
        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
