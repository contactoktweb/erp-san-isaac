import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  getModulesByArea,
  MODULE_AREAS,
  type ModuleArea,
  type ModuleItem,
} from '@/lib/modules'
import { cn } from '@/lib/utils'

export function ModuleIndex() {
  const groupedModules = getModulesByArea()

  return (
    <div className="flex flex-col gap-10">
      {MODULE_AREAS.map((area) => {
        const modules = groupedModules[area]
        if (!modules || modules.length === 0) return null

        return (
          <section key={area} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between border-b pb-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {area}
              </h2>
              <span className="text-xs font-medium text-muted-foreground">
                {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="divide-y divide-border/60">
                {modules.map((item) => (
                  <ModuleRow key={item.slug} item={item} />
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ModuleRow({ item }: { item: ModuleItem }) {
  const Icon = item.icon
  const isDevelopment = item.status === 'En desarrollo'

  return (
    <div className="group flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-4">
      <div className="flex items-start gap-4 sm:items-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-foreground transition-colors group-hover:border-foreground/20 group-hover:bg-background">
          <Icon className="size-5 text-brand-brown" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/${item.slug}`}
              className="text-base font-semibold text-foreground transition-colors hover:text-primary hover:underline"
            >
              {item.name}
            </Link>
            <span className="sm:hidden">
              <StatusBadge status={item.status} />
            </span>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {item.shortDescription}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2 sm:shrink-0 sm:pt-0">
        <div className="hidden sm:block">
          <StatusBadge status={item.status} />
        </div>
        <Link
          href={`/dashboard/${item.slug}`}
          className={cn(
            'inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline',
            isDevelopment
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label={`Abrir módulo de ${item.name}`}
        >
          <span>Abrir módulo</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'En desarrollo' | 'Próximamente' }) {
  if (status === 'En desarrollo') {
    return (
      <Badge
        variant="outline"
        className="border-amber-300 bg-amber-50 font-medium text-amber-900"
      >
        En desarrollo
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-border/70 bg-muted/60 font-medium text-muted-foreground"
    >
      Próximamente
    </Badge>
  )
}
