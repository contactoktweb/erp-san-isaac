'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

interface ForbiddenBannerProps {
  moduleName: string
}

/**
 * Banner de acceso denegado que aparece cuando el middleware redirige
 * a un usuario sin el rol necesario para acceder a un módulo protegido.
 * Se auto-descarta a los 6 segundos y limpia los query params de la URL.
 */
export function ForbiddenBanner({ moduleName }: ForbiddenBannerProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Limpiar los parámetros de la URL sin recargar la página
    window.history.replaceState({}, '', '/dashboard')

    // Auto-descartar después de 6 segundos
    timerRef.current = setTimeout(() => {
      router.refresh()
    }, 6000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [router])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/8 px-4 py-3.5 text-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-destructive">Acceso restringido</p>
        <p className="text-muted-foreground">
          No tienes los permisos necesarios para acceder al módulo de{' '}
          <strong className="text-foreground">{moduleName}</strong>. Comunícate con el administrador del
          sistema si necesitas acceso.
        </p>
      </div>
    </div>
  )
}
