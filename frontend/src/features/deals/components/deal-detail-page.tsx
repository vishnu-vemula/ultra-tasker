import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
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
    <tr>
      <td className="td">
        <p className="font-medium text-slate-900">{item.description}</p>
        {item.product ? <p className="text-xs text-slate-400">{item.product.name}</p> : null}
      </td>
      <td className="td">
        <input
          key={`${item.id}-qty-${item.quantity}`}
          type="number"
          min="1"
          step="1"
          defaultValue={item.quantity}
          className="input w-20 px-2 py-1"
          onBlur={(event) => commitQuantity(event.target.value)}
        />
      </td>
      <td className="td">
        <input
          key={`${item.id}-price-${item.unitPrice}`}
          type="number"
          min="0"
          step="any"
          defaultValue={item.unitPrice}
          className="input w-28 px-2 py-1"
          onBlur={(event) => commitUnitPrice(event.target.value)}
        />
      </td>
      <td className="td font-medium text-slate-900">
        {formatCurrency(item.quantity * item.unitPrice, currency)}
      </td>
      <td className="td text-right">
        <ConfirmButton onConfirm={() => deleteMutation.mutate({ dealId, itemId: item.id })} />
      </td>
    </tr>
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
    <tr className="bg-slate-50">
      <td className="td">
        <select className="select mb-1 w-40" value={productId} onChange={(event) => selectProduct(event.target.value)}>
          <option value="">Free text</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Description"
          className="input"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </td>
      <td className="td">
        <input
          type="number"
          min="1"
          step="1"
          className="input w-20 px-2 py-1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </td>
      <td className="td">
        <input
          type="number"
          min="0"
          step="any"
          className="input w-28 px-2 py-1"
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          placeholder="0.00"
        />
      </td>
      <td className="td" />
      <td className="td text-right">
        <button
          type="button"
          className="btn-secondary px-2.5 py-1.5"
          disabled={!description.trim() || createMutation.isPending}
          onClick={submit}
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </td>
    </tr>
  )
}

export function DealDetailPage() {
  const { dealId } = useParams()
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
            <button type="button" className="btn-secondary" onClick={() => setActivityOpen(true)}>
              <Plus className="h-4 w-4" />
              Log activity
            </button>
            <button type="button" className="btn-primary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit deal
            </button>
          </>
        }
      />

      <section className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          {DEAL_STAGES.map((stage, index) => (
            <button
              key={stage}
              type="button"
              disabled={stageMutation.isPending}
              className={clsx(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                stage === deal.stage
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-700',
              )}
              onClick={() => stageMutation.mutate({ id: deal.id, input: { stage } })}
            >
              {index + 1}. {titleCase(stage)}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Details</h2>
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
                  <Link className="text-indigo-600 hover:text-indigo-700" to={`/contacts/${deal.contactId}`}>
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
                  <Link className="text-indigo-600 hover:text-indigo-700" to={`/companies/${deal.companyId}`}>
                    {deal.company.name}
                  </Link>
                ) : (
                  '—'
                ),
            },
            { label: 'Notes', value: deal.notes ?? '—' },
          ]}
        />
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</span>
            {editingTags ? (
              <div className="flex gap-2">
                <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => setEditingTags(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary px-2.5 py-1 text-xs"
                  disabled={setTagsMutation.isPending}
                  onClick={() => void saveTags()}
                >
                  Save tags
                </button>
              </div>
            ) : (
              <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-700" onClick={startEditTags}>
                Edit tags
              </button>
            )}
          </div>
          {editingTags ? (
            <TagSelect value={draftTagIds} onChange={setDraftTagIds} />
          ) : deal.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {deal.tags.map((tag) => (
                <span key={tag.id} className="badge items-center gap-1.5 bg-slate-100 text-slate-700">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No tags.</p>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Line items</h2>
          <p className="text-xs text-slate-400">Deal value syncs automatically when items change.</p>
        </div>
        <table className="w-full">
          <thead className="border-y border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Description</th>
              <th className="th">Qty</th>
              <th className="th">Unit price</th>
              <th className="th">Line total</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deal.items.map((item) => (
              <LineItemRow key={item.id} dealId={deal.id} item={item} currency={deal.currency} />
            ))}
            <AddItemRow dealId={deal.id} />
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <td className="td font-semibold text-slate-900" colSpan={3}>
                Items total
              </td>
              <td className="td font-semibold text-slate-900">{formatCurrency(itemsTotal, deal.currency)}</td>
              <td className="td" />
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Activity</h2>
          <button type="button" className="btn-secondary" onClick={() => setActivityOpen(true)}>
            <Plus className="h-4 w-4" />
            Log activity
          </button>
        </div>
        <ActivityTimeline activities={deal.activities} />
      </section>

      <AuditSection entityType="DEAL" entityId={deal.id} />

      {editOpen ? <DealDialog deal={deal} onClose={() => setEditOpen(false)} /> : null}
      {activityOpen ? <ActivityDialog presetDealId={deal.id} onClose={() => setActivityOpen(false)} /> : null}
    </div>
  )
}
