import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type LoadingStateProps = {
  label?: string
  rows?: number
  className?: string
}

export function LoadingState({ label = 'Cargando información…', rows = 4, className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col gap-6', className)}>
      <span className="sr-only">{label}</span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-full max-w-sm" />
      </div>
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}
