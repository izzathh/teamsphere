import useUIStore from '../store/uiStore'

export const useToast = () => {
  const addToast = useUIStore((s) => s.addToast)

  return {
    success: (message) => addToast({ type: 'success', message }),
    error: (message) => addToast({ type: 'error', message }),
    info: (message) => addToast({ type: 'info', message }),
    warn: (message) => addToast({ type: 'warn', message }),
  }
}
