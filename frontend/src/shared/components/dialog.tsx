import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  title: string
  children: ReactNode
  onClose: () => void
}

export function Dialog({ title, children, onClose }: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" className="btn-ghost px-2 py-2" onClick={onClose} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
