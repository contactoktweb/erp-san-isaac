import type { Metadata } from 'next'
import { Logo } from '@/components/brand/logo'
import { siteConfig } from '@/lib/site-config'
import { LoginBrandPanel } from '@/modules/auth/components/login-brand-panel'
import { LoginForm } from '@/modules/auth/components/login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <LoginBrandPanel />

      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <header className="flex flex-col gap-5">
            <Logo size={88} priority className="lg:hidden" />
            <div className="flex flex-col gap-2">
              <p className="eyebrow lg:hidden">{siteConfig.shortName} · Gestión interna</p>
              <h1 className="text-3xl font-semibold">Iniciar sesión</h1>
              <p className="text-muted-foreground">
                Ingresa con tu correo corporativo para continuar.
              </p>
            </div>
          </header>

          <LoginForm />

          <p className="text-sm text-muted-foreground">
            ¿Olvidaste tu contraseña? Solicita el restablecimiento al administrador del sistema.
          </p>
        </div>
      </main>
    </div>
  )
}
