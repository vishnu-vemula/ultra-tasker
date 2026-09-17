import type { ReactNode } from 'react'

interface DescriptionItem {
  label: string
  value: ReactNode
}

interface DescriptionListProps {
  items: DescriptionItem[]
}

export function DescriptionList({ items }: DescriptionListProps) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
          <dd className="mt-1 text-sm text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
