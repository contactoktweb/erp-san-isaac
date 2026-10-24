import type { Metadata } from 'next'
import { Heart } from 'lucide-react'
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
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card p-1 shadow-xs">
                <Logo size={36} priority decorative />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-brand-gold" aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold-strong">
                    ERP San Isaac
                  </span>
                </div>
                <span className="text-sm font-bold tracking-tight text-primary">
                  Sistema de Gestión Interna
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
              <p className="text-muted-foreground">
                Ingresa con tu correo corporativo para continuar.
              </p>
            </div>
          </header>

          <LoginForm />

          <p className="text-sm text-muted-foreground">
            ¿Olvidaste tu contraseña? Solicita el restablecimiento al administrador del sistema.
          </p>

          <footer className="pt-2 text-center lg:hidden">
            <a
              href="https://www.kytcode.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>Desarrollado por K&T</span>
              <Heart className="size-3 fill-black text-black" aria-hidden="true" />
            </a>
          </footer>
        </div>
      </main>
    </div>
  )
}
