import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import type { Deal, DealDetail, Page, ReorderUpdate } from '../../../shared/types'
import {
  createDeal,
  createDealItem,
  deleteDeal,
  deleteDealItem,
  reorderDeals,
  setDealTags,
  updateDeal,
  updateDealItem,
  type DealInput,
  type DealItemInput,
} from '../api/deals-api'

function notifyError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong')
}

function applyReorder(page: Page<Deal>, updates: ReorderUpdate[]): Page<Deal> {
  const updatesById = new Map(updates.map((update) => [update.id, update]))
  const movedByStage = new Map<string, Array<Deal & { nextPosition: number }>>()
  const remainingByStage = new Map<string, Deal[]>()

  for (const deal of page.items) {
    const update = updatesById.get(deal.id)
    if (update) {
      const list = movedByStage.get(update.stage) ?? []
      list.push({ ...deal, stage: update.stage, nextPosition: update.position })
      movedByStage.set(update.stage, list)
    } else {
      const list = remainingByStage.get(deal.stage) ?? []
      list.push(deal)
      remainingByStage.set(deal.stage, list)
    }
  }

  const items: Deal[] = []
  for (const stage of new Set([...remainingByStage.keys(), ...movedByStage.keys()])) {
    const remaining = (remainingByStage.get(stage) ?? []).slice().sort((a, b) => a.position - b.position)
    const moved = (movedByStage.get(stage) ?? []).slice().sort((a, b) => a.nextPosition - b.nextPosition)
    for (const deal of moved) {
      remaining.splice(Math.min(deal.nextPosition, remaining.length), 0, { ...deal, position: deal.nextPosition })
    }
    items.push(...remaining)
  }
  return { ...page, items }
}

function useInvalidateDeals() {
  const queryClient = useQueryClient()
  return (dealId?: string) => {
    if (dealId) void queryClient.invalidateQueries({ queryKey: ['deal', dealId] })
    void queryClient.invalidateQueries({ queryKey: ['deals'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useCreateDeal() {
  const invalidate = useInvalidateDeals()
  return useMutation({
    mutationFn: (input: DealInput) => createDeal(input),
    onSuccess: () => {
      toast.success('Deal saved')
      invalidate()
    },
    onError: notifyError,
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateDeals()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DealInput> }) => updateDeal(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ['deal', id] })
      const previous = queryClient.getQueryData<DealDetail>(['deal', id])
      if (previous) {
        queryClient.setQueryData<DealDetail>(['deal', id], { ...previous, ...input })
      }
      return { previous }
    },
    onSuccess: () => {
      toast.success('Deal saved')
    },
    onError: (error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(['deal', id], context.previous)
      notifyError(error)
    },
    onSettled: (_data, _error, { id }) => {
      invalidate(id)
    },
  })
}

export function useSetDealTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tagIds }: { id: string; tagIds: string[] }) => setDealTags(id, tagIds),
    onSuccess: () => {
      toast.success('Tags updated')
      void queryClient.invalidateQueries({ queryKey: ['deals'] })
      void queryClient.invalidateQueries({ queryKey: ['deal'] })
    },
    onError: notifyError,
  })
}

export function useCreateDealItem() {
  const invalidate = useInvalidateDeals()
  return useMutation({
    mutationFn: ({ dealId, input }: { dealId: string; input: DealItemInput }) => createDealItem(dealId, input),
    onSuccess: (_item, { dealId }) => {
      toast.success('Line item added')
      invalidate(dealId)
    },
    onError: notifyError,
  })
}

export function useUpdateDealItem() {
  const invalidate = useInvalidateDeals()
  return useMutation({
    mutationFn: ({ dealId, itemId, input }: { dealId: string; itemId: string; input: Partial<DealItemInput> }) =>
      updateDealItem(dealId, itemId, input),
    onSuccess: (_item, { dealId }) => {
      toast.success('Line item saved')
      invalidate(dealId)
    },
    onError: notifyError,
  })
}

export function useDeleteDealItem() {
  const invalidate = useInvalidateDeals()
  return useMutation({
    mutationFn: ({ dealId, itemId }: { dealId: string; itemId: string }) => deleteDealItem(dealId, itemId),
    onSuccess: (_result, { dealId }) => {
      toast.success('Line item removed')
      invalidate(dealId)
    },
    onError: notifyError,
  })
}

export function useDeleteDeal() {
  const invalidate = useInvalidateDeals()
  return useMutation({
    mutationFn: (id: string) => deleteDeal(id),
    onSuccess: () => {
      toast.success('Deal deleted')
      invalidate()
    },
    onError: notifyError,
  })
}

export function useReorderDeals() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: ReorderUpdate[]) => reorderDeals(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['deals'] })
      const previousPages = queryClient.getQueriesData<Page<Deal>>({ queryKey: ['deals'] })
      for (const [key, page] of previousPages) {
        if (page) queryClient.setQueryData(key, applyReorder(page, updates))
      }
      return { previousPages }
    },
    onError: (_error, _updates, context) => {
      for (const [key, page] of context?.previousPages ?? []) {
        queryClient.setQueryData(key, page)
      }
      notifyError(_error)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['deals'] })
      void queryClient.invalidateQueries({ queryKey: ['deal'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
