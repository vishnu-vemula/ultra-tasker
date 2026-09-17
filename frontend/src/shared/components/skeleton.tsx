export function SkeletonCard() {
  return (
    <div className="card animate-pulse p-6">
      <div className="mb-4 h-4 w-1/3 rounded bg-slate-200" />
      <div className="mb-2 h-3 w-full rounded bg-slate-200" />
      <div className="mb-2 h-3 w-2/3 rounded bg-slate-200" />
      <div className="h-3 w-1/2 rounded bg-slate-200" />
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card animate-pulse flex items-center gap-4 p-4">
          <div className="h-9 w-9 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
          <div className="h-5 w-16 rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  )
}
