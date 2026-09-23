import { Card, CardContent } from './ui/card'
import { Skeleton } from './ui/skeleton'

export function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="mb-4 h-4 w-1/3" />
        <Skeleton className="mb-2 h-3 w-full" />
        <Skeleton className="mb-2 h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="animate-pulse">
          <div className="flex items-center gap-4 p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  )
}
