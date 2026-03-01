import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen dot-pattern flex items-center justify-center p-4">
      <div className="text-center animate-slide-up">
        <div className="text-8xl font-display text-[var(--border)] mb-4">404</div>
        <h1 className="text-2xl font-display text-[var(--text)] mb-2">Page not found</h1>
        <p className="text-[var(--text-muted)] mb-6">The page you're looking for doesn't exist or was moved.</p>
        <Link to="/dashboard" className="btn-primary">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
