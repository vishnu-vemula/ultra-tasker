import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { Dialog } from '../../../shared/components/dialog'
import { ConfirmButton } from '../../../shared/components/confirm-button'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonList } from '../../../shared/components/skeleton'
import { EmptyState } from '../../../shared/components/empty-state'
import { Badge } from '../../../shared/components/ui/badge'
import { Button } from '../../../shared/components/ui/button'
import { Card } from '../../../shared/components/ui/card'
import { Input } from '../../../shared/components/ui/input'
import { Label } from '../../../shared/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table'
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
        <div className="space-y-2">
          <Label htmlFor="tag-name">Name</Label>
          <Input id="tag-name" type="text" {...register('name')} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tag-color">Color</Label>
          <div className="flex items-center gap-3">
            <input
              id="tag-color"
              type="color"
              className="h-10 w-14 cursor-pointer rounded border bg-card p-1"
              value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6366f1'}
              onChange={(event) => setValue('color', event.target.value, { shouldValidate: true })}
            />
            <Input type="text" className="font-mono" {...register('color')} />
          </div>
          {errors.color ? <p className="text-sm text-destructive">{errors.color.message}</p> : null}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Saving…' : 'Save tag'}
          </Button>
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
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New tag
          </Button>
        }
      />
      {isLoading ? (
        <SkeletonList count={4} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No tags yet"
          description="Add your first tag to start organizing contacts and deals."
          action={
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New tag
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((tag) => (
                <TableRow
                  key={tag.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(tag)}
                >
                  <TableCell>
                    <Badge variant="muted" className="gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{tag.color}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(tag.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <ConfirmButton onConfirm={() => deleteMutation.mutate(tag.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {dialogOpen ? <TagDialog tag={editing} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
