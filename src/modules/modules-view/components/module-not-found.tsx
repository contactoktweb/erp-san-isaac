import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function ModuleNotFound({ slug }: { slug: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 rounded-xl border border-border/80 bg-card p-8 text-center sm:p-12">
      <div className="flex size-14 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-900">
        <AlertCircle className="size-7" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Error 404 · Módulo no encontrado
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          El módulo solicitado no existe
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          No se encontró ningún módulo registrado con el identificador{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {slug}
          </code>
          . Verifica la ruta ingresada o regresa al panel principal para ver los 10 módulos disponibles.
        </p>
      </div>

      <Button asChild variant="outline" className="gap-2">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Volver al panel principal</span>
        </Link>
      </Button>
    </div>
  )
}
