import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2, Pencil, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useDealDetail } from '../hooks/use-deals'
import {
  useCreateDealItem,
  useDeleteDealItem,
  useSetDealTags,
  useUpdateDeal,
  useUpdateDealItem,
} from '../hooks/use-deal-mutations'
import { DealDialog } from './deal-dialog'
import { DetailHeader } from '../../../shared/components/detail-header'
import { DescriptionList } from '../../../shared/components/description-list'
import { SkeletonList } from '../../../shared/components/skeleton'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { AuditSection } from '../../../shared/components/audit-section'
import { Badge } from '../../../shared/components/ui/badge'
import { Button } from '../../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card'
import { Input } from '../../../shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table'
import { formatCurrency, formatDate, titleCase } from '../../../shared/lib/format'
import { DEAL_STAGES } from '../../../shared/types'
import { useProducts } from '../../products/hooks/use-products'
import { ActivityTimeline } from '../../activities/components/activity-timeline'
import { ActivityDialog } from '../../activities/components/activity-dialog'
import { TagSelect } from '../../tags/components/tag-select'
import type { DealItem } from '../../../shared/types'

interface LineItemRowProps {
  dealId: string
  item: DealItem
  currency: string
}

function LineItemRow({ dealId, item, currency }: LineItemRowProps) {
  const updateMutation = useUpdateDealItem()
  const deleteMutation = useDeleteDealItem()

  const commitQuantity = (value: string) => {
    const quantity = Number(value)
    if (Number.isFinite(quantity) && quantity > 0 && quantity !== item.quantity) {
      updateMutation.mutate({ dealId, itemId: item.id, input: { quantity } })
    }
  }

  const commitUnitPrice = (value: string) => {
    const unitPrice = Number(value)
    if (Number.isFinite(unitPrice) && unitPrice >= 0 && unitPrice !== item.unitPrice) {
      updateMutation.mutate({ dealId, itemId: item.id, input: { unitPrice } })
    }
  }

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium text-foreground">{item.description}</p>
        {item.product ? <p className="text-xs text-muted-foreground/70">{item.product.name}</p> : null}
      </TableCell>
      <TableCell>
        <Input
          key={`${item.id}-qty-${item.quantity}`}
          type="number"
          min="1"
          step="1"
          defaultValue={item.quantity}
          className="w-20 px-2 py-1"
          onBlur={(event) => commitQuantity(event.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          key={`${item.id}-price-${item.unitPrice}`}
          type="number"
          min="0"
          step="any"
          defaultValue={item.unitPrice}
          className="w-28 px-2 py-1"
          onBlur={(event) => commitUnitPrice(event.target.value)}
        />
      </TableCell>
      <TableCell className="font-medium text-foreground">
        {formatCurrency(item.quantity * item.unitPrice, currency)}
      </TableCell>
      <TableCell className="text-right">
        <ConfirmButton onConfirm={() => deleteMutation.mutate({ dealId, itemId: item.id })} />
      </TableCell>
    </TableRow>
  )
}

interface AddItemRowProps {
  dealId: string
}

function AddItemRow({ dealId }: AddItemRowProps) {
  const createMutation = useCreateDealItem()
  const { data: productList } = useProducts({})
  const [productId, setProductId] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')

  const products = productList?.items ?? []

  const selectProduct = (id: string) => {
    setProductId(id)
    const product = products.find((entry) => entry.id === id)
    if (product) {
      setDescription(product.name)
      setUnitPrice(String(product.price))
    }
  }

  const submit = () => {
    if (!description.trim()) return
    createMutation.mutate(
      {
        dealId,
        input: {
          productId: productId || null,
          description: description.trim(),
          quantity: Number(quantity) || 1,
          unitPrice: Number(unitPrice) || 0,
        },
      },
      {
        onSuccess: () => {
          setProductId('')
          setDescription('')
          setQuantity('1')
          setUnitPrice('')
        },
      },
    )
  }

  return (
    <TableRow className="bg-secondary">
      <TableCell>
        <div className="space-y-1">
          <Select
            value={productId || 'NONE'}
            onValueChange={(value) => selectProduct(value === 'NONE' ? '' : value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Free text</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          step="1"
          className="w-20 px-2 py-1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="any"
          className="w-28 px-2 py-1"
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          placeholder="0.00"
        />
      </TableCell>
      <TableCell />
      <TableCell className="text-right">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!description.trim() || createMutation.isPending}
          onClick={submit}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>()
  const { data: deal, isLoading } = useDealDetail(dealId ?? '')
  const stageMutation = useUpdateDeal()
  const setTagsMutation = useSetDealTags()
  const [editOpen, setEditOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [draftTagIds, setDraftTagIds] = useState<string[]>([])

  if (isLoading || !deal) {
    return (
      <div>
        <DetailHeader backTo="/deals" backLabel="Deals" title="Deal" />
        <SkeletonList count={5} />
      </div>
    )
  }

  const itemsTotal = deal.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const startEditTags = () => {
    setDraftTagIds(deal.tags.map((tag) => tag.id))
    setEditingTags(true)
  }

  const saveTags = async () => {
    await setTagsMutation.mutateAsync({ id: deal.id, tagIds: draftTagIds })
    setEditingTags(false)
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/deals"
        backLabel="Deals"
        title={deal.title}
        subtitle={`${formatCurrency(deal.value, deal.currency)} · ${deal.contact?.name ?? 'No contact'}${
          deal.company ? ` · ${deal.company.name}` : ''
        }`}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setActivityOpen(true)}>
              <Plus className="h-4 w-4" />
              Log activity
            </Button>
            <Button type="button" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit deal
            </Button>
          </>
        }
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          {DEAL_STAGES.map((stage, index) => (
            <button
              key={stage}
              type="button"
              disabled={stageMutation.isPending}
              className={clsx(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                stage === deal.stage
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border bg-card text-muted-foreground hover:border-primary hover:text-primary',
              )}
              onClick={() => stageMutation.mutate({ id: deal.id, input: { stage } })}
            >
              {index + 1}. {titleCase(stage)}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DescriptionList
            items={[
              { label: 'Value', value: formatCurrency(deal.value, deal.currency) },
              { label: 'Probability', value: `${deal.probability}%` },
              { label: 'Stage', value: titleCase(deal.stage) },
              { label: 'Source', value: deal.source ? titleCase(deal.source) : '—' },
              { label: 'Expected close', value: formatDate(deal.expectedCloseDate) },
              { label: 'Closed at', value: formatDate(deal.closedAt) },
              { label: 'Next step', value: deal.nextStep ?? '—' },
              { label: 'Lost reason', value: deal.lostReason ?? '—' },
              {
                label: 'Contact',
                value:
                  deal.contact && deal.contactId ? (
                    <Link className="text-primary hover:text-primary/80" href={`/contacts/${deal.contactId}`}>
                      {deal.contact.name}
                    </Link>
                  ) : (
                    '—'
                  ),
              },
              {
                label: 'Company',
                value:
                  deal.company && deal.companyId ? (
                    <Link className="text-primary hover:text-primary/80" href={`/companies/${deal.companyId}`}>
                      {deal.company.name}
                    </Link>
                  ) : (
                    '—'
                  ),
              },
              { label: 'Notes', value: deal.notes ?? '—' },
            ]}
          />
          <div className="mt-6 border-t pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Tags</span>
              {editingTags ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTags(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={setTagsMutation.isPending}
                    onClick={() => void saveTags()}
                  >
                    {setTagsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save tags
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:text-primary/80"
                  onClick={startEditTags}
                >
                  Edit tags
                </button>
              )}
            </div>
            {editingTags ? (
              <TagSelect value={draftTagIds} onChange={setDraftTagIds} />
            ) : deal.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {deal.tags.map((tag) => (
                  <Badge key={tag.id} variant="muted" className="gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Line items</CardTitle>
          <CardDescription>Deal value syncs automatically when items change.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Description</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit price</TableHead>
              <TableHead>Line total</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {deal.items.map((item) => (
              <LineItemRow key={item.id} dealId={deal.id} item={item} currency={deal.currency} />
            ))}
            <AddItemRow dealId={deal.id} />
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="font-semibold text-foreground" colSpan={3}>
                Items total
              </TableCell>
              <TableCell className="font-semibold text-foreground">
                {formatCurrency(itemsTotal, deal.currency)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Activity</CardTitle>
          <Button type="button" variant="outline" onClick={() => setActivityOpen(true)}>
            <Plus className="h-4 w-4" />
            Log activity
          </Button>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={deal.activities} />
        </CardContent>
      </Card>

      <AuditSection entityType="DEAL" entityId={deal.id} />

      {editOpen ? <DealDialog deal={deal} onClose={() => setEditOpen(false)} /> : null}
      {activityOpen ? <ActivityDialog presetDealId={deal.id} onClose={() => setActivityOpen(false)} /> : null}
    </div>
  )
}
