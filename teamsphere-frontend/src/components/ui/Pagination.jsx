export default function Pagination({ page, totalPages, onPageChange, totalItems, limit }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  const left = Math.max(1, page - delta)
  const right = Math.min(totalPages, page + delta)

  for (let i = left; i <= right; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
      <p className="text-sm text-[var(--text-muted)]">
        Showing{' '}
        <span className="font-medium text-[var(--text)]">
          {Math.min((page - 1) * limit + 1, totalItems)}–{Math.min(page * limit, totalItems)}
        </span>{' '}
        of <span className="font-medium text-[var(--text)]">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="btn-ghost px-2 py-1.5 disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {left > 1 && (
          <>
            <PageBtn n={1} current={page} onClick={onPageChange} />
            {left > 2 && <span className="px-1 text-[var(--text-muted)]">…</span>}
          </>
        )}

        {pages.map((n) => (
          <PageBtn key={n} n={n} current={page} onClick={onPageChange} />
        ))}

        {right < totalPages && (
          <>
            {right < totalPages - 1 && <span className="px-1 text-[var(--text-muted)]">…</span>}
            <PageBtn n={totalPages} current={page} onClick={onPageChange} />
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="btn-ghost px-2 py-1.5 disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function PageBtn({ n, current, onClick }) {
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
        n === current
          ? 'bg-[var(--text)] text-[var(--bg)]'
          : 'hover:bg-[var(--bg-subtle)] text-[var(--text-muted)]'
      }`}
    >
      {n}
    </button>
  )
}
