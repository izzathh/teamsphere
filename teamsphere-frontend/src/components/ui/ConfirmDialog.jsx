import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-[var(--text-muted)] mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button
          className={variant === 'danger' ? 'btn-destructive' : 'btn-primary'}
          onClick={() => { onConfirm(); onClose() }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
