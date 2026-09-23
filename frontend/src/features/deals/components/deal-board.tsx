import { useMemo, useState } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { DEAL_STAGES, type Deal, type DealStage, type ReorderUpdate } from '../../../shared/types'
import { titleCase, formatCurrency } from '../../../shared/lib/format'
import { Badge } from '../../../shared/components/ui/badge'
import { Button } from '../../../shared/components/ui/button'
import { Card } from '../../../shared/components/ui/card'
import { useDeals } from '../hooks/use-deals'
import { useReorderDeals } from '../hooks/use-deal-mutations'
import { DealCard } from './deal-card'
import { DealDialog } from './deal-dialog'

const OPEN_STAGES: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION']

interface DealBoardProps {
  search?: string
}

export function DealBoard({ search }: DealBoardProps) {
  const { data, isLoading } = useDeals({ sort: 'position', search })
  const reorderMutation = useReorderDeals()
  const [editing, setEditing] = useState<Deal | null>(null)
  const [defaultStage, setDefaultStage] = useState<DealStage>('NEW')
  const [dialogOpen, setDialogOpen] = useState(false)

  const deals = useMemo(() => data?.items ?? [], [data])

  const columns = useMemo(
    () =>
      DEAL_STAGES.map((stage) => {
        const items = deals.filter((deal) => deal.stage === stage)
        const totalsByCurrency = new Map<string, number>()
        for (const deal of items) {
          totalsByCurrency.set(deal.currency, (totalsByCurrency.get(deal.currency) ?? 0) + deal.value)
        }
        return {
          stage,
          items,
          totals: Array.from(totalsByCurrency.entries()).map(([currency, value]) =>
            formatCurrency(value, currency),
          ),
        }
      }),
    [deals],
  )

  const handleDragEnd = (result: DropResult) => {
    const { destination } = result
    if (!destination) return
    const stage = destination.droppableId as DealStage
    const update: ReorderUpdate = {
      id: result.draggableId,
      stage,
      position: destination.index,
    }
    if (result.source.droppableId === destination.droppableId && result.source.index === destination.index) {
      return
    }
    reorderMutation.mutate([update])
  }

  const openCreate = (stage: DealStage) => {
    setEditing(null)
    setDefaultStage(stage)
    setDialogOpen(true)
  }

  const openEdit = (deal: Deal) => {
    setEditing(deal)
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {DEAL_STAGES.map((stage) => (
          <Card key={stage} className="h-64 animate-pulse bg-secondary" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(({ stage, items, totals }) => (
            <Card key={stage} className="flex w-72 shrink-0 flex-col bg-secondary">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{titleCase(stage)}</p>
                    <Badge variant="muted">{items.length}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totals.length > 0 ? totals.join(' / ') : formatCurrency(0, 'USD')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openCreate(stage)}
                  aria-label={`New deal in ${stage}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-24 flex-1 flex-col gap-2 p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/10' : ''
                    }`}
                  >
                    {items.map((deal, index) => (
                      <DealCard key={deal.id} deal={deal} index={index} onEdit={openEdit} />
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && !snapshot.isDraggingOver ? (
                      <button
                        type="button"
                        className="w-full rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground/70 hover:border-primary hover:text-primary"
                        onClick={() => openCreate(stage)}
                      >
                        + New deal
                      </button>
                    ) : null}
                  </div>
                )}
              </Droppable>
            </Card>
          ))}
        </div>
      </DragDropContext>
      <p className="mt-2 text-xs text-muted-foreground/70">
        {columns
          .filter((column) => OPEN_STAGES.includes(column.stage))
          .flatMap((column) => column.totals)
          .join(' / ') || formatCurrency(0, 'USD')}{' '}
        in open pipeline
      </p>
      {dialogOpen ? (
        <DealDialog deal={editing} defaultStage={defaultStage} onClose={() => setDialogOpen(false)} />
      ) : null}
    </div>
  )
}
