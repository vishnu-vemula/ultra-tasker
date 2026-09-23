import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Package, Plus, Search } from 'lucide-react'
import { Dialog } from '../../../shared/components/dialog'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { Button } from '../../../shared/components/ui/button'
import { Card } from '../../../shared/components/ui/card'
import { Input } from '../../../shared/components/ui/input'
import { Label } from '../../../shared/components/ui/label'
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
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table'
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
    control,
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
        <div className="space-y-2">
          <Label htmlFor="product-name">Name</Label>
          <Input id="product-name" type="text" {...register('name')} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-sku">SKU</Label>
            <Input id="product-sku" type="text" {...register('sku')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-price">Price</Label>
            <Input id="product-price" type="number" min="0" step="any" {...register('price')} />
            {errors.price ? <p className="text-sm text-destructive">{errors.price.message}</p> : null}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-end pb-1">
            <label
              htmlFor="product-active"
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <input id="product-active" type="checkbox" className="h-4 w-4 rounded border" {...register('active')} />
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Saving…' : 'Save product'}
          </Button>
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
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New product
          </Button>
        }
      />
      <div className="mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="search"
            placeholder="Search products…"
            className="pl-9"
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
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New product
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((product) => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(product)}
                >
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(product.price, product.currency)}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border"
                        checked={product.active}
                        onChange={() => updateMutation.mutate({ id: product.id, input: { active: !product.active } })}
                      />
                      {product.active ? 'Active' : 'Inactive'}
                    </label>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(product.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(product.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {dialogOpen ? <ProductDialog product={editing} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
