import { CheckCircle2, Clock, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ModuleFunction } from '@/lib/modules'

export function ModuleFunctions({ functions }: { functions: ModuleFunction[] }) {
  return (
    <section aria-labelledby="section-funciones" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-muted-foreground" aria-hidden="true" />
          <h2 id="section-funciones" className="text-lg font-semibold text-foreground">
            Funciones del módulo según alcance cotizado
          </h2>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {functions.length} funciones catalogadas
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {functions.map((func) => {
          const isAvailable = func.status === 'Disponible'

          return (
            <div
              key={func.name}
              className="flex flex-col justify-between gap-3 rounded-lg border border-border/70 bg-card p-4 transition-colors hover:border-border"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground leading-tight">
                    {func.name}
                  </h3>
                  <FunctionStatusBadge status={func.status} />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {func.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-1 text-[0.6875rem] text-muted-foreground border-t border-border/40">
                {isAvailable ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                    <span className="font-medium text-emerald-700">Operativo en Fase 1</span>
                  </>
                ) : (
                  <>
                    <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>Construcción en Fase 2</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FunctionStatusBadge({ status }: { status: 'Disponible' | 'Pendiente' }) {
  if (status === 'Disponible') {
    return (
      <Badge
        variant="outline"
        className="shrink-0 border-emerald-300 bg-emerald-50 px-1.5 py-0 text-[0.6875rem] font-medium text-emerald-800"
      >
        Disponible
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="shrink-0 border-border/60 bg-muted/50 px-1.5 py-0 text-[0.6875rem] font-medium text-muted-foreground"
    >
      Pendiente
    </Badge>
  )
}
