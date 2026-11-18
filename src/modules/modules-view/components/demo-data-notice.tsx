import { Info } from 'lucide-react'

export function DemoDataNotice({ entityName }: { entityName: string }) {
  return (
    <div
      role="note"
      className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground"
    >
      <div className="flex items-center gap-2">
        <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-foreground">Datos de demostración:</strong> Visualización previa de{' '}
          {entityName.toLowerCase()} generada a partir de los repositorios mock del sistema.
        </span>
      </div>
      <span className="hidden shrink-0 rounded border border-border/80 bg-background px-2 py-0.5 font-mono text-[0.6875rem] font-medium text-foreground sm:inline-block">
        Fase 2 · Solo lectura
      </span>
    </div>
  )
}
