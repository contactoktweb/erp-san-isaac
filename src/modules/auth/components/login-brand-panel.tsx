import { Heart } from 'lucide-react'
import { CandleRule } from '@/components/brand/candle-rule'
import { Logo } from '@/components/brand/logo'
import { siteConfig } from '@/lib/site-config'

export function LoginBrandPanel() {
  const year = new Date().getFullYear()

  return (
    <aside className="hidden flex-col justify-between border-r bg-secondary px-12 py-12 lg:flex xl:px-16">
      <p className="eyebrow">Sistema de gestión interna</p>

      <div className="flex flex-col gap-8">
        <Logo size={168} priority />
        <div className="flex flex-col gap-4">
          <CandleRule />
          <h2 className="max-w-sm text-3xl font-semibold text-primary xl:text-4xl">
            {siteConfig.companyName}
          </h2>
          <p className="text-lg italic text-brand-brown">{siteConfig.tagline}</p>
        </div>
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
