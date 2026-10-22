import { CircleAlert, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = 'No pudimos cargar esta sección',
  description = 'Ocurrió un problema inesperado. Intenta de nuevo y, si persiste, comunícate con el administrador.',
  onRetry,
  retryLabel = 'Reintentar',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-4 rounded-lg border border-danger/30 bg-danger-soft p-6 sm:flex-row',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-lg font-semibold text-danger">{title}</h3>
        <p className="text-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="bg-card">
          <RotateCcw aria-hidden="true" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
