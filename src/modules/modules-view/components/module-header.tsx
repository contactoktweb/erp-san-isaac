import { Badge } from '@/components/ui/badge'
import { CandleRule } from '@/components/brand/candle-rule'
import type { ModuleItem } from '@/lib/modules'

export function ModuleHeader({ module }: { module: ModuleItem }) {
  const Icon = module.icon
  const isDevelopment = module.status === 'En desarrollo'

  return (
    <header className="flex flex-col gap-4 border-b pb-6">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>Área: {module.area}</span>
        <span aria-hidden="true">·</span>
        <span>ERP San Isaac</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-secondary text-primary">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3">
            <CandleRule className="hidden sm:inline-flex" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
              {module.name}
            </h1>
          </div>
        </div>

        <div>
          {isDevelopment ? (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
            >
              En desarrollo
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-border/70 bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              Próximamente
            </Badge>
          )}
        </div>
      </div>

      <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
        {module.shortDescription}
      </p>
    </header>
  )
}
