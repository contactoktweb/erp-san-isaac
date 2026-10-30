import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import {
  getModulesByArea,
  MODULE_AREAS,
  type ModuleItem,
} from '@/lib/modules'
import { cn } from '@/lib/utils'

/**
 * Visibilidad de módulos por rol, basada en el ROLE_PERMISSION_MATRIX oficial.
 * Si el slug no aparece aquí → visible para cualquier usuario autenticado.
 * ADMIN tiene cortocircuito explícito: siempre ve todo.
 *
 * VENTAS      : orders.*, inventory.read, packing.read, admin.users.read
 * JEFE_PLANTA : orders.read, packing.*, inventory.*, admin.users.read
 * ALISTAMIENTO: orders.read, packing.*
 */
const MODULE_ALLOWED_ROLES: Record<string, string[]> = {
  // Solo ADMIN
  administracion:            ['ADMIN'],
  compras:                   ['ADMIN'],
  contabilidad:              ['ADMIN'],
  nomina:                    ['ADMIN'],
  'libros-societarios':      ['ADMIN'],
  reportes:                  ['ADMIN'],
  pos:                       ['ADMIN'],
  // ADMIN + VENTAS
  'documentos-electronicos': ['ADMIN', 'VENTAS'],
  // ADMIN + VENTAS + JEFE_PLANTA
  inventarios:               ['ADMIN', 'VENTAS', 'JEFE_PLANTA'],
  // ADMIN + JEFE_PLANTA + ALISTAMIENTO (Producción = empaque/packing)
  produccion:                ['ADMIN', 'JEFE_PLANTA', 'ALISTAMIENTO'],
  // Todos los roles autenticados
  ventas:                    ['ADMIN', 'VENTAS', 'JEFE_PLANTA', 'ALISTAMIENTO'],
}

export async function ModuleIndex() {
  const session = await getServerSession(authOptions)
  const userRole = (session?.user?.role as string | undefined)?.trim().toUpperCase() ?? ''

  const groupedModules = getModulesByArea()

  return (
    <div className="flex flex-col gap-10">
      {MODULE_AREAS.map((area) => {
        const allModules = groupedModules[area] ?? []

        // ADMIN siempre ve todos los módulos sin excepción
        const visibleModules = userRole === 'ADMIN'
          ? allModules
          : allModules.filter((item) => {
              const allowedRoles = MODULE_ALLOWED_ROLES[item.slug]
              if (!allowedRoles) return true // sin restricción → visible para todos
              return allowedRoles.some((r) => r === userRole)
            })

        if (visibleModules.length === 0) return null

        return (
          <section key={area} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between border-b pb-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {area}
              </h2>
              <span className="text-xs font-medium text-muted-foreground">
                {visibleModules.length} {visibleModules.length === 1 ? 'módulo' : 'módulos'}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="divide-y divide-border/60">
                {visibleModules.map((item) => (
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
