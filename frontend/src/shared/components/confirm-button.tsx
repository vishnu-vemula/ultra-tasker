'use client'

import { useState, type MouseEventHandler } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'

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
  const [open, setOpen] = useState(false)

  const handleTriggerClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleTriggerClick}
          disabled={disabled}
          aria-label={label}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
