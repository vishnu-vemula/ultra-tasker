import { useState } from 'react'
import { Search } from 'lucide-react'
import { PageHeader } from '../../../shared/components/page-header'
import { useDebouncedValue } from '../../../shared/hooks/use-debounced-value'
import { DealBoard } from './deal-board'

export function DealsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  return (
    <div>
      <PageHeader title="Deals" description="Drag deals between stages to move them through your pipeline" />
      <div className="mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search deals…"
            className="input pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <DealBoard search={debouncedSearch || undefined} />
    </div>
  )
}
