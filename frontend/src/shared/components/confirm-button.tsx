import type { MouseEventHandler } from 'react'
import { Trash2 } from 'lucide-react'

interface ConfirmButtonProps {
  onConfirm: () => void
  label?: string
  confirmMessage?: string
  disabled?: boolean
}

export function ConfirmButton({
  onConfirm,
  label = 'Delete',
  confirmMessage = 'Are you sure? This action cannot be undone.',
  disabled,
}: ConfirmButtonProps) {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
    if (window.confirm(confirmMessage)) onConfirm()
  }

  return (
    <button type="button" className="btn-danger px-2.5 py-1.5" onClick={handleClick} disabled={disabled}>
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </button>
  )
}
