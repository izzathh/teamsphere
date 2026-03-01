export const fieldClass = (error) =>
  `input${error ? ' input-error' : ''}`

export function FieldError({ error }) {
  if (!error) return null
  return (
    <p className="form-error" role="alert" aria-live="polite">
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {error.message || error}
    </p>
  )
}

export default function FormField({ label, required, error, hint, children }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label}
          {required && <span className="field-required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{hint}</p>
      )}
      <FieldError error={error} />
    </div>
  )
}
