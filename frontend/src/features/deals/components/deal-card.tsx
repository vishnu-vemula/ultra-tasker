import { Draggable } from '@hello-pangea/dnd'
import { Building2, User } from 'lucide-react'
import clsx from 'clsx'
import type { Deal } from '../../../shared/types'
import { formatCurrency, formatDate } from '../../../shared/lib/format'
import { Badge } from '../../../shared/components/ui/badge'
import { Card } from '../../../shared/components/ui/card'

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
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={clsx(
            'cursor-grab p-3 active:cursor-grabbing',
            snapshot.isDragging && 'ring-2 ring-primary',
          )}
          onClick={() => onEdit(deal)}
        >
          <p className="mb-1 text-sm font-medium text-foreground">{deal.title}</p>
          <p className="mb-2 text-sm font-semibold text-primary">
            {formatCurrency(deal.value, deal.currency)}
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <Badge variant="muted">{deal.probability}% likely</Badge>
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
              <Badge variant={overdue ? 'danger' : 'muted'}>
                {overdue ? 'Overdue · ' : ''}
                {formatDate(deal.expectedCloseDate)}
              </Badge>
            ) : null}
          </div>
        </Card>
      )}
    </Draggable>
  )
}
