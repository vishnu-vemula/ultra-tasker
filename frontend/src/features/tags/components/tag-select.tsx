import clsx from 'clsx'
import { useTags } from '../hooks/use-tags'

interface TagSelectProps {
  value: string[]
  onChange: (tagIds: string[]) => void
}

export function TagSelect({ value, onChange }: TagSelectProps) {
  const { data, isLoading } = useTags()
  const tags = data?.items ?? []

  const toggle = (tagId: string) => {
    onChange(value.includes(tagId) ? value.filter((id) => id !== tagId) : [...value, tagId])
  }

  if (isLoading) {
    return <div className="h-8 animate-pulse rounded bg-slate-100" />
  }

  if (tags.length === 0) {
    return <p className="text-sm text-slate-500">No tags yet — create them in Settings → Tags.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = value.includes(tag.id)
        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(tag.id)}
            className={clsx(
              'badge cursor-pointer items-center gap-1.5 border transition-colors',
              selected
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
