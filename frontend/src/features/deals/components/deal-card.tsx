import { Draggable } from '@hello-pangea/dnd'
import { Building2, User } from 'lucide-react'
import clsx from 'clsx'
import type { Deal } from '../../../shared/types'
import { formatCurrency, formatDate } from '../../../shared/lib/format'

interface DealCardProps {
  deal: Deal
  index: number
  onEdit: (deal: Deal) => void
}

export function DealCard({ deal, index, onEdit }: DealCardProps) {
  const overdue =
    deal.expectedCloseDate !== null &&
    deal.stage !== 'WON' &&
    deal.stage !== 'LOST' &&
    new Date(deal.expectedCloseDate) < new Date()

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={clsx(
            'card cursor-grab p-3 active:cursor-grabbing',
            snapshot.isDragging && 'ring-2 ring-indigo-500',
          )}
          onClick={() => onEdit(deal)}
        >
          <p className="mb-1 text-sm font-medium text-slate-900">{deal.title}</p>
          <p className="mb-2 text-sm font-semibold text-indigo-600">
            {formatCurrency(deal.value, deal.currency)}
          </p>
          <div className="space-y-1 text-xs text-slate-500">
            {deal.contact ? (
              <p className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {deal.contact.name}
              </p>
            ) : null}
            {deal.company ? (
              <p className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {deal.company.name}
              </p>
            ) : null}
            {deal.expectedCloseDate ? (
              <p
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                  overdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600',
                )}
              >
                {overdue ? 'Overdue · ' : ''}
                {formatDate(deal.expectedCloseDate)}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </Draggable>
  )
}
