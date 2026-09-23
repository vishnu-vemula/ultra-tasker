'use client'

import type { ReactNode } from 'react'
import {
  Dialog as UiDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface DialogProps {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Dialog({ title, description, children, onClose }: DialogProps) {
  return (
    <UiDialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </UiDialog>
  )
}
