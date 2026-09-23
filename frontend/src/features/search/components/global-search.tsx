import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, KanbanSquare, Loader2, Search, UsersRound } from 'lucide-react'
import { Input } from '../../../shared/components/ui/input'
import { useDebouncedValue } from '../../../shared/hooks/use-debounced-value'
import { formatCurrency, titleCase } from '../../../shared/lib/format'
import { useSearch } from '../hooks/use-search'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const { data, isFetching } = useSearch(open ? debouncedQuery : '')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setQuery('')
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  const hasResults =
    data !== undefined && data.contacts.length + data.companies.length + data.deals.length > 0

  const goTo = (path: string) => {
    setQuery('')
    setOpen(false)
    router.push(path)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search contacts, companies, deals…"
          className="pl-9"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(event.target.value.trim().length > 0)
          }}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true)
          }}
        />
      </div>
      {open && debouncedQuery.length >= 1 ? (
        <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md animate-fade-in-up">
          {isFetching && !data ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : !hasResults ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No results for “{debouncedQuery}”.</p>
          ) : (
            <div className="space-y-3">
              {data && data.contacts.length > 0 ? (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Contacts</p>
                  <ul>
                    {data.contacts.map((contact) => (
                      <li key={contact.id}>
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => goTo(`/contacts/${contact.id}`)}
                        >
                          <UsersRound className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                            {contact.name}
                          </span>
                          <span className="shrink-0 truncate text-xs text-muted-foreground/70">{contact.email ?? ''}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data && data.companies.length > 0 ? (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Companies</p>
                  <ul>
                    {data.companies.map((company) => (
                      <li key={company.id}>
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => goTo(`/companies/${company.id}`)}
                        >
                          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                            {company.name}
                          </span>
                          <span className="shrink-0 truncate text-xs text-muted-foreground/70">{company.domain ?? ''}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data && data.deals.length > 0 ? (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Deals</p>
                  <ul>
                    {data.deals.map((deal) => (
                      <li key={deal.id}>
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => goTo(`/deals/${deal.id}`)}
                        >
                          <KanbanSquare className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                            {deal.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground/70">
                            {titleCase(deal.stage)} · {formatCurrency(deal.value, deal.currency)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
