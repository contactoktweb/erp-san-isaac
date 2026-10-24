import { Heart } from 'lucide-react'
import { CandleRule } from '@/components/brand/candle-rule'
import { Logo } from '@/components/brand/logo'
import { siteConfig } from '@/lib/site-config'

export function LoginBrandPanel() {
  const year = new Date().getFullYear()

  return (
    <aside className="hidden flex-col justify-between border-r bg-secondary px-12 py-12 lg:flex xl:px-16">
      <header className="flex items-center gap-3.5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card p-1 shadow-xs">
          <Logo size={40} priority decorative />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-gold" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-strong">
              ERP Corporativo
            </span>
          </div>
          <p className="text-lg font-bold tracking-tight text-primary xl:text-xl">
            Sistema de Gestión Interna
          </p>
        </div>
      </header>

      <div className="flex max-w-sm flex-col gap-6 -translate-y-10">
        <CandleRule />
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight text-primary xl:text-4xl">
            {siteConfig.companyName}
          </h2>
          <p className="text-lg italic text-brand-brown">{siteConfig.tagline}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Control integral de producción, inventario, ventas y logística para la operación de Velas San Isaac.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {`© ${year} ${siteConfig.companyName}. Uso exclusivo interno.`}
        </p>
        <a
          href="https://www.kytcode.lat"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>Desarrollado por K&T</span>
          <Heart className="size-3 fill-black text-black" aria-hidden="true" />
        </a>
      </div>
    </aside>
  )
}
