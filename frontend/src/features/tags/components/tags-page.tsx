import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Dialog } from '../../../shared/components/dialog'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { formatDate } from '../../../shared/lib/format'
import type { Tag } from '../../../shared/types'
import { tagFormSchema, type TagFormValues } from '../model/schema'
import { useTags } from '../hooks/use-tags'
import { useCreateTag, useDeleteTag, useUpdateTag } from '../hooks/use-tag-mutations'

interface TagDialogProps {
  tag: Tag | null
  onClose: () => void
}

function TagDialog({ tag, onClose }: TagDialogProps) {
  const createMutation = useCreateTag()
  const updateMutation = useUpdateTag()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    values: { name: tag?.name ?? '', color: tag?.color ?? '#6366f1' },
  })

  const color = watch('color')

  const onSubmit = handleSubmit(async (values) => {
    if (tag) {
      await updateMutation.mutateAsync({ id: tag.id, input: values })
    } else {
      await createMutation.mutateAsync(values)
    }
    onClose()
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog title={tag ? 'Edit tag' : 'New tag'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="tag-name" className="label">
            Name
          </label>
          <input id="tag-name" type="text" className="input" {...register('name')} />
          {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
        <div>
          <label htmlFor="tag-color" className="label">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="tag-color"
              type="color"
              className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1"
              value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6366f1'}
              onChange={(event) => setValue('color', event.target.value, { shouldValidate: true })}
            />
            <input type="text" className="input font-mono" {...register('color')} />
          </div>
          {errors.color ? <p className="mt-1 text-sm text-red-600">{errors.color.message}</p> : null}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save tag'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

export function TagsPage() {
  const { data, isLoading } = useTags()
  const deleteMutation = useDeleteTag()
  const [editing, setEditing] = useState<Tag | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (tag: Tag) => {
    setEditing(tag)
    setDialogOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Labels you can attach to contacts and deals"
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New tag
          </button>
        }
      />
      {isLoading ? (
        <SkeletonList count={4} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No tags yet"
          description="Add your first tag to start organizing contacts and deals."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New tag
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Color</th>
                <th className="th">Created</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((tag) => (
                <tr
                  key={tag.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => openEdit(tag)}
                >
                  <td className="td">
                    <span className="badge items-center gap-1.5 bg-slate-100 text-slate-700">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </span>
                  </td>
                  <td className="td font-mono text-xs text-slate-500">{tag.color}</td>
                  <td className="td">{formatDate(tag.createdAt)}</td>
                  <td className="td text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(tag.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialogOpen ? <TagDialog tag={editing} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
