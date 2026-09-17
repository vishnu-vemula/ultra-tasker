import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Package, Plus, Search } from 'lucide-react'
import { Dialog } from '../../../shared/components/dialog'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { useDebouncedValue } from '../../../shared/hooks/use-debounced-value'
import { formatCurrency, formatDate } from '../../../shared/lib/format'
import { CURRENCIES, type Product } from '../../../shared/types'
import { productFormSchema, type ProductFormValues } from '../model/schema'
import { useProducts } from '../hooks/use-products'
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from '../hooks/use-product-mutations'

interface ProductDialogProps {
  product: Product | null
  onClose: () => void
}

function toFormValues(product: Product | null): ProductFormValues {
  if (!product) return { name: '', sku: '', price: 0, currency: 'USD', active: true }
  return {
    name: product.name,
    sku: product.sku ?? '',
    price: product.price,
    currency: (CURRENCIES.includes(product.currency) ? product.currency : 'USD') as ProductFormValues['currency'],
    active: product.active,
  }
}

function ProductDialog({ product, onClose }: ProductDialogProps) {
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    values: toFormValues(product),
  })

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      sku: values.sku || undefined,
      price: values.price,
      currency: values.currency,
      active: values.active,
    }
    if (product) {
      await updateMutation.mutateAsync({ id: product.id, input })
    } else {
      await createMutation.mutateAsync(input)
    }
    onClose()
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog title={product ? 'Edit product' : 'New product'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="product-name" className="label">
            Name
          </label>
          <input id="product-name" type="text" className="input" {...register('name')} />
          {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-sku" className="label">
              SKU
            </label>
            <input id="product-sku" type="text" className="input" {...register('sku')} />
          </div>
          <div>
            <label htmlFor="product-price" className="label">
              Price
            </label>
            <input id="product-price" type="number" min="0" step="any" className="input" {...register('price')} />
            {errors.price ? <p className="mt-1 text-sm text-red-600">{errors.price.message}</p> : null}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-currency" className="label">
              Currency
            </label>
            <select id="product-currency" className="select" {...register('currency')}>
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label htmlFor="product-active" className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input id="product-active" type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('active')} />
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search)
  const params = useMemo(() => ({ search: debouncedSearch }), [debouncedSearch])
  const { data, isLoading } = useProducts(params)
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setDialogOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog items you can attach to deal line items"
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New product
          </button>
        }
      />
      <div className="mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search products…"
            className="input pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      {isLoading ? (
        <SkeletonList count={4} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to use it on deal line items."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New product
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">SKU</th>
                <th className="th">Price</th>
                <th className="th">Active</th>
                <th className="th">Created</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((product) => (
                <tr
                  key={product.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => openEdit(product)}
                >
                  <td className="td font-medium text-slate-900">{product.name}</td>
                  <td className="td">{product.sku ?? '—'}</td>
                  <td className="td">{formatCurrency(product.price, product.currency)}</td>
                  <td className="td" onClick={(event) => event.stopPropagation()}>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={product.active}
                        onChange={() => updateMutation.mutate({ id: product.id, input: { active: !product.active } })}
                      />
                      {product.active ? 'Active' : 'Inactive'}
                    </label>
                  </td>
                  <td className="td">{formatDate(product.createdAt)}</td>
                  <td className="td text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(product.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialogOpen ? <ProductDialog product={editing} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
