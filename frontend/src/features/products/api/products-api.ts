import { apiFetch } from '../../../shared/lib/api-client'
import type { Product } from '../../../shared/types'

export interface ListProductsParams {
  search?: string
}

export interface ProductInput {
  name: string
  sku?: string
  price: number
  currency?: string
  active?: boolean
}

export interface ProductsList {
  items: Product[]
  total: number
}

export async function listProducts(params: ListProductsParams): Promise<ProductsList> {
  const search = new URLSearchParams()
  if (params.search) search.set('search', params.search)
  const query = search.toString()
  const result = await apiFetch<ProductsList>(`/products${query ? `?${query}` : ''}`)
  if (result === null) throw new Error('Unexpected empty response from /products')
  return result
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const result = await apiFetch<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from POST /products')
  return result
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const result = await apiFetch<Product>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (result === null) throw new Error('Unexpected empty response from PATCH /products/:id')
  return result
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<null>(`/products/${id}`, { method: 'DELETE' })
}
